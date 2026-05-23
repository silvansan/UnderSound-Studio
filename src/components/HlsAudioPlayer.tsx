'use client'

import Hls from 'hls.js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LiveAudioPlayerShell } from '@/components/LiveAudioPlayerShell'
import { appendHlsCacheBuster } from '@/lib/streaming/build-hls-url'
import { waitForPlayableHlsManifest } from '@/lib/streaming/hls-manifest-client'
import { createHlsJsLiveConfig, HLS_COMPAT_LATENCY_LABEL, toLiveHlsManifestUrl } from '@/lib/streaming/ll-hls-config'

type HlsAudioPlayerProps = {
  autoPlay?: boolean
  hlsUrl: string
  /** When true, skip manifest polling (egress is already live). */
  manifestReady?: boolean
  onError?: (message: string) => void
  onReady?: () => void
  /** Bumps on each fresh LL-HLS session to avoid stale segment loops. */
  sessionKey?: number
}

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error' | 'waiting'

/** Preserves autoplay permission when switching transports from a button click. */
export function unlockBrowserAudioPlayback(): void {
  if (typeof document === 'undefined') {
    return
  }

  const audio = document.createElement('audio')
  audio.setAttribute('playsinline', 'true')
  audio.src =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQQAAAAAAA=='
  void audio.play().catch(() => {})
}


function stripCacheBuster(manifestUrl: string): string {
  try {
    const parsed = new URL(manifestUrl)

    parsed.searchParams.delete('v')

    return parsed.toString()
  } catch {
    return manifestUrl.split('?')[0] ?? manifestUrl
  }
}

async function waitForCanPlay(media: HTMLMediaElement, timeoutMs = 10000): Promise<boolean> {
  if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return true
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs)

    const finish = (ready: boolean) => {
      window.clearTimeout(timer)
      resolve(ready)
    }

    const check = () => {
      if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        finish(true)
      }
    }

    media.addEventListener('canplay', check, { once: true })
    media.addEventListener('loadedmetadata', check, { once: true })
  })
}

export function HlsAudioPlayer({
  autoPlay = true,
  hlsUrl,
  manifestReady = false,
  onError,
  onReady,
  sessionKey = 0,
}: HlsAudioPlayerProps) {
  const mediaRef = useRef<HTMLAudioElement>(null)
  const hlsRef = useRef<{
    destroy: () => void
    loadSource: (url: string) => void
    recoverMediaError: () => void
    startLoad: (startPosition?: number) => void
    stopLoad: () => void
  } | null>(null)
  const playableUrlRef = useRef<string | null>(null)
  const liveManifestUrlRef = useRef<string | null>(null)
  const playbackModeRef = useRef<'hlsjs' | 'native' | null>(null)
  const mediaReadyRef = useRef(false)
  const recoveryGenerationRef = useRef(0)
  const onErrorRef = useRef(onError)
  const onReadyRef = useRef(onReady)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  onErrorRef.current = onError
  onReadyRef.current = onReady

  const syncPlaybackState = useCallback(() => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    setIsPlaying(!media.paused && !media.ended)
    setIsMuted(media.muted)
  }, [])

  const reportFatalError = useCallback((message: string) => {
    setStatus('error')
    setIsBuffering(false)
    setIsPlaying(false)
    setStatusMessage(message)
    onErrorRef.current?.(message)
  }, [])

  const nudgeLiveEdge = useCallback((restart = false) => {
    if (!hlsRef.current) {
      return
    }

    if (restart) {
      hlsRef.current.stopLoad()
    }

    hlsRef.current.startLoad(-1)
  }, [])

  const beginPlayback = useCallback(async () => {
    const media = mediaRef.current

    if (!media || status === 'waiting' || status === 'loading' || status === 'error') {
      return false
    }

    if (!mediaReadyRef.current) {
      setStatusMessage('LL-HLS is still buffering. Wait a moment, then tap play again.')
      return false
    }

    if (playbackModeRef.current === 'hlsjs') {
      nudgeLiveEdge(false)
    }

    try {
      await media.play()
      setStatusMessage(null)
      syncPlaybackState()
      return true
    } catch {
      setStatus('ready')
      setStatusMessage('Tap play to start LL-HLS playback.')
      syncPlaybackState()
      return false
    }
  }, [nudgeLiveEdge, status, syncPlaybackState])

  const togglePlayback = useCallback(async () => {
    const media = mediaRef.current

    if (!media || status === 'waiting' || status === 'loading' || status === 'error') {
      return
    }

    if (media.paused) {
      await beginPlayback()
      return
    }

    media.pause()
    syncPlaybackState()
  }, [beginPlayback, status, syncPlaybackState])

  const toggleMute = useCallback(() => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    media.muted = !media.muted
    setIsMuted(media.muted)
  }, [])

  useEffect(() => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    const preferNativePlayback = isLikelySafariBrowser()

    let cancelled = false
    let markReady: (() => void) | null = null
    let onPlaying: (() => void) | null = null
    let onPause: (() => void) | null = null
    let onWaiting: (() => void) | null = null
    let onCanPlay: (() => void) | null = null
    let stallWatchdog: number | null = null
    let nativeStallWatchdog: number | null = null
    let lastPlaybackTime = 0
    let nativeReloads = 0
    let lastProgressAt = Date.now()
    let staleSegmentRecoveries = 0
    let sourceReloads = 0

    function noteProgress() {
      lastProgressAt = Date.now()
      staleSegmentRecoveries = 0
    }

    function nudgeLiveEdge(restart = false) {
      if (!hlsRef.current) {
        return
      }

      if (restart) {
        hlsRef.current.stopLoad()
      }

      hlsRef.current.startLoad(-1)
    }

    async function reloadNativeToLive(reason: string) {
      const baseUrl = liveManifestUrlRef.current

      if (!media || cancelled || !baseUrl || nativeReloads >= 6) {
        return
      }

      nativeReloads += 1
      const wasPlaying = !media.paused


      media.pause()
      media.src = appendHlsCacheBuster(baseUrl, Date.now())
      media.load()

      const ready = await waitForCanPlay(media, 6000)

      if (!ready || cancelled) {
        return
      }

      mediaReadyRef.current = true

      if (wasPlaying || autoPlay) {
        try {
          await media.play()
          noteProgress()
          setStatusMessage(null)
        } catch {
          setStatus('ready')
          setStatusMessage('Tap play to start LL-HLS playback.')
        }
      }
    }

    async function startNativePlayback(liveUrl: string): Promise<boolean> {
      if (!media || cancelled) {
        return false
      }

      playbackModeRef.current = 'native'
      liveManifestUrlRef.current = liveUrl
      media.src = liveUrl
      media.load()

      const ready = await waitForCanPlay(media, 10000)

      if (!ready || cancelled) {
        playbackModeRef.current = null
        media.removeAttribute('src')
        media.load()
        return false
      }

      mediaReadyRef.current = true


      markReady?.()

      if (autoPlay) {
        await attemptAutoPlay()
      }

      nativeStallWatchdog = window.setInterval(() => {
        if (cancelled || media.paused || playbackModeRef.current !== 'native') {
          return
        }

        const currentTime = media.currentTime

        if (currentTime > 0 && currentTime === lastPlaybackTime && media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          void reloadNativeToLive('native playback stalled')
        }

        lastPlaybackTime = currentTime
      }, 2500)

      return true
    }

    async function attemptAutoPlay() {
      if (!media || cancelled || !mediaReadyRef.current) {
        return
      }

      try {
        await media.play()
        noteProgress()
        setStatusMessage(null)
      } catch {
        setStatus('ready')
        setIsBuffering(false)
        setStatusMessage('Tap play to start LL-HLS playback.')
        markReady?.()
      }
    }

    async function reloadFreshSource(reason: string) {
      if (cancelled || sourceReloads >= 4) {
        if (!cancelled && sourceReloads >= 4) {
          reportFatalError('The LL-HLS stream keeps falling behind live. Try switching modes again.')
        }

        return
      }

      sourceReloads += 1
      setStatus('loading')
      setIsBuffering(true)
      setStatusMessage('Re-syncing LL-HLS to live audio...')

      const generation = recoveryGenerationRef.current + 1
      recoveryGenerationRef.current = generation

      hlsRef.current?.destroy()
      hlsRef.current = null

      const refreshedUrl = appendHlsCacheBuster(toLiveHlsManifestUrl(hlsUrl), `${sessionKey}-${Date.now()}`)
      const playableUrl = await waitForPlayableHlsManifest(refreshedUrl, 12, 750)

      if (cancelled || generation !== recoveryGenerationRef.current) {
        return
      }

      if (!playableUrl) {
        reportFatalError(`${reason} Try switching to compatibility mode again.`)
        return
      }

      playableUrlRef.current = playableUrl

      try {
        if (cancelled || !media) {
          return
        }


        if (!Hls.isSupported() || cancelled || !media) {
          return
        }

        const hls = new Hls(createHlsJsLiveConfig())
        hlsRef.current = hls
        hls.loadSource(stripCacheBuster(toLiveHlsManifestUrl(playableUrl)))
        hls.attachMedia(media)
        attachHlsHandlers(hls, Hls)

        if (!media.paused) {
          await attemptAutoPlay()
        }

        markReady?.()
      } catch {
        reportFatalError('Could not re-sync the LL-HLS stream.')
      }
    }

    function attachHlsHandlers(hls: Hls, HlsModule: typeof Hls) {
      const player = hls as {
        on: (event: string, listener: (...args: unknown[]) => void) => void
        recoverMediaError: () => void
        startLoad: (startPosition?: number) => void
        stopLoad: () => void
      }

      player.on(HlsModule.Events.MANIFEST_PARSED, () => {
        if (cancelled) {
          return
        }

      })

      player.on(HlsModule.Events.LEVEL_LOADED, () => {
        if (cancelled) {
          return
        }

      })

      player.on(HlsModule.Events.FRAG_BUFFERED, () => {
        if (cancelled) {
          return
        }

        noteProgress()
        setIsBuffering(false)
        mediaReadyRef.current = true
        markReady?.()

        if (autoPlay && media?.paused) {
          void attemptAutoPlay()
        }
      })

      player.on(HlsModule.Events.ERROR, (_event, data) => {
        if (cancelled) {
          return
        }

        const errorData = data as {
          details?: string
          fatal?: boolean
          response?: { code?: number }
          type?: string
        }
        const responseCode = errorData.response?.code
        const fragUrl = (errorData as { frag?: { relurl?: string } }).frag?.relurl


        if (errorData.details === HlsModule.ErrorDetails.FRAG_LOAD_ERROR) {
          staleSegmentRecoveries += 1

          if (staleSegmentRecoveries <= 3) {
            nudgeLiveEdge(true)
            return
          }

          void reloadFreshSource('The LL-HLS stream restarted.')
          return
        }

        if (!errorData.fatal) {
          return
        }

        if (errorData.type === HlsModule.ErrorTypes.NETWORK_ERROR) {
          if (staleSegmentRecoveries >= 2 || sourceReloads > 0) {
            void reloadFreshSource('The LL-HLS connection dropped.')
            return
          }

          nudgeLiveEdge(true)
          return
        }

        if (errorData.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
          player.recoverMediaError()
          return
        }

        reportFatalError('The LL-HLS stream is unavailable right now.')
      })
    }

    async function startPlayback() {
      if (!media) {
        return
      }

      setStatus('waiting')
      setStatusMessage(null)
      setIsPlaying(false)
      setIsBuffering(true)
      recoveryGenerationRef.current = 0
      sourceReloads = 0
      staleSegmentRecoveries = 0
      nativeReloads = 0
      lastProgressAt = Date.now()
      lastPlaybackTime = 0
      playbackModeRef.current = null
      mediaReadyRef.current = false
      liveManifestUrlRef.current = null
      hlsRef.current?.destroy()
      hlsRef.current = null

      const cachedUrl = appendHlsCacheBuster(toLiveHlsManifestUrl(hlsUrl), sessionKey)
      const playableUrl = await waitForPlayableHlsManifest(
        cachedUrl,
        manifestReady ? 20 : 45,
        1000,
      )

      if (cancelled) {
        return
      }

      if (!playableUrl) {
        reportFatalError(
          'The LL-HLS stream is not ready yet. Make sure a speaker is live, wait a few seconds, then try compatibility mode again.',
        )
        return
      }

      playableUrlRef.current = playableUrl
      const liveUrl = stripCacheBuster(toLiveHlsManifestUrl(playableUrl))
      liveManifestUrlRef.current = liveUrl
      setStatus('loading')

      markReady = () => {
        if (cancelled) {
          return
        }

        setStatus('ready')
        onReadyRef.current?.()
      }

      onPlaying = () => {
        if (cancelled) {
          return
        }

        setIsBuffering(false)
        setIsPlaying(true)
        setStatusMessage(null)
        noteProgress()
        markReady?.()
      }

      onPause = () => {
        if (cancelled) {
          return
        }

        setIsPlaying(false)
        setIsBuffering(false)
      }

      onWaiting = () => {
        if (cancelled) {
          return
        }

        setIsBuffering(true)

        if (playbackModeRef.current === 'native') {
          void reloadNativeToLive('native waiting event')
        }
      }

      onCanPlay = () => {
        if (cancelled) {
          return
        }

        setIsBuffering(false)
      }

      media.addEventListener('playing', onPlaying)
      media.addEventListener('pause', onPause)
      media.addEventListener('waiting', onWaiting)
      media.addEventListener('canplay', onCanPlay)

      if (preferNativePlayback && (await startNativePlayback(liveUrl))) {
        return
      }

      playbackModeRef.current = 'hlsjs'
      mediaReadyRef.current = false

      try {
        if (cancelled || !media) {
          return
        }


        if (Hls.isSupported()) {
          const hls = new Hls(createHlsJsLiveConfig())

          hlsRef.current = hls
          hls.loadSource(liveUrl)
          hls.attachMedia(media)


          attachHlsHandlers(hls, Hls)

          stallWatchdog = window.setInterval(() => {
            if (cancelled || media.paused) {
              return
            }

            if (Date.now() - lastProgressAt > 5000) {
              lastProgressAt = Date.now()
              void reloadFreshSource('LL-HLS stalled.')
            }
          }, 2000)

          return
        }

      } catch (error) {
      }

      reportFatalError(
        Hls.isSupported()
          ? 'The LL-HLS player failed to start. Try switching modes again.'
          : 'This browser does not support LL-HLS playback.',
      )
    }

    void startPlayback()

    return () => {
      cancelled = true
      recoveryGenerationRef.current += 1

      if (stallWatchdog) {
        window.clearInterval(stallWatchdog)
      }

      if (nativeStallWatchdog) {
        window.clearInterval(nativeStallWatchdog)
      }

      playbackModeRef.current = null
      mediaReadyRef.current = false

      if (onPlaying) {
        media.removeEventListener('playing', onPlaying)
      }

      if (onPause) {
        media.removeEventListener('pause', onPause)
      }

      if (onWaiting) {
        media.removeEventListener('waiting', onWaiting)
      }

      if (onCanPlay) {
        media.removeEventListener('canplay', onCanPlay)
      }

      hlsRef.current?.destroy()
      hlsRef.current = null
      media.pause()
      media.removeAttribute('src')
      media.load()
      setIsPlaying(false)
      setIsBuffering(false)
    }
  }, [autoPlay, hlsUrl, manifestReady, reportFatalError, sessionKey])

  const statusLabel =
    statusMessage ??
    (status === 'waiting'
      ? 'Waiting for the first LL-HLS audio segment. This usually takes a few seconds after a speaker connects...'
      : status === 'loading'
        ? 'Buffering the first LL-HLS audio segment...'
        : status === 'ready'
          ? isBuffering
            ? `Buffering LL-HLS (${HLS_COMPAT_LATENCY_LABEL})...`
            : isPlaying
              ? `LL-HLS is playing (${HLS_COMPAT_LATENCY_LABEL}). Use WebRTC for the lowest delay.`
              : `LL-HLS is ready (${HLS_COMPAT_LATENCY_LABEL}). Press play to listen.`
          : status === 'error'
            ? 'Compatibility stream failed to start.'
            : 'LL-HLS compatibility mode selected.')

  return (
    <div className="us-hls-player mt-4 space-y-3">
      <audio ref={mediaRef} className="hidden" playsInline preload="auto" />
      <LiveAudioPlayerShell
        disabled={status === 'waiting' || status === 'loading' || status === 'error'}
        isBuffering={isBuffering && status !== 'waiting' && status !== 'loading'}
        isMuted={isMuted}
        isPlaying={isPlaying}
        label="Live"
        mode="LL-HLS compatibility"
        onToggleMute={toggleMute}
        onTogglePlayback={() => {
          void togglePlayback()
        }}
      />

      <p className="text-sm leading-6" style={{ color: status === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
        {statusLabel}
      </p>
    </div>
  )
}

export function isLikelySafariBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent

  return /Safari/i.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(userAgent)
}

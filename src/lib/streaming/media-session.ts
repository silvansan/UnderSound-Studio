export type MediaSessionBinding = {
  artist: string
  artworkUrl?: string
  audioElement: HTMLMediaElement
  onPause?: () => void
  onPlay?: () => void | Promise<void>
  title: string
}

export function isMobileWebListener(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function resolveDefaultArtworkUrl(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}/icon.png`
}

/** Prefer media playback over voice-call routing on Safari when available. */
export function configureMediaPlaybackSession(): void {
  if (typeof navigator === 'undefined') {
    return
  }

  const audioSession = (navigator as Navigator & { audioSession?: { type: string } }).audioSession

  if (audioSession) {
    audioSession.type = 'playback'
  }
}

export function clearMediaSession(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  navigator.mediaSession.setActionHandler('play', null)
  navigator.mediaSession.setActionHandler('pause', null)
  navigator.mediaSession.metadata = null
  navigator.mediaSession.playbackState = 'none'
}

export function bindMediaSession(binding: MediaSessionBinding): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return () => {}
  }

  const { artist, artworkUrl, audioElement, onPause, onPlay, title } = binding
  const session = navigator.mediaSession

  session.metadata = new MediaMetadata({
    album: 'Ablaut Live',
    artist,
    artwork: artworkUrl
      ? [
          {
            sizes: '512x512',
            src: artworkUrl,
            type: 'image/png',
          },
        ]
      : [],
    title,
  })

  const syncPlaybackState = () => {
    session.playbackState = audioElement.paused ? 'paused' : 'playing'
  }

  const handlePlay = () => {
    void (async () => {
      try {
        if (onPlay) {
          await onPlay()
        } else {
          await audioElement.play()
        }

        session.playbackState = 'playing'
      } catch {
        session.playbackState = 'paused'
      }
    })()
  }

  const handlePause = () => {
    try {
      if (onPause) {
        onPause()
      } else {
        audioElement.pause()
      }

      session.playbackState = 'paused'
    } catch {
      session.playbackState = 'paused'
    }
  }

  session.setActionHandler('play', handlePlay)
  session.setActionHandler('pause', handlePause)

  audioElement.addEventListener('play', syncPlaybackState)
  audioElement.addEventListener('pause', syncPlaybackState)
  audioElement.addEventListener('emptied', syncPlaybackState)
  syncPlaybackState()

  return () => {
    audioElement.removeEventListener('play', syncPlaybackState)
    audioElement.removeEventListener('pause', syncPlaybackState)
    audioElement.removeEventListener('emptied', syncPlaybackState)
    clearMediaSession()
  }
}

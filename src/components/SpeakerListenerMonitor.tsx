'use client'

import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from 'livekit-client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LiveAudioPlayerShell } from '@/components/LiveAudioPlayerShell'

type SpeakerListenerMonitorProps = {
  channelName: string
  channelSlug: string
  eventSlug: string
  fallbackUrl?: string | null
  webrtcEnabled?: boolean | null
}

type ListenerTokenResponse = {
  error?: string
  token: string
  url: string
}

type MonitorState = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'

export function SpeakerListenerMonitor({
  channelName,
  channelSlug,
  eventSlug,
  fallbackUrl,
  webrtcEnabled,
}: SpeakerListenerMonitorProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const attachedTrackRef = useRef<RemoteTrack | null>(null)
  const roomRef = useRef<Room | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<MonitorState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const showPlayer = state === 'connecting' || state === 'connected'

  const syncPlaybackState = useCallback(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    setIsPlaying(!audio.paused && !audio.ended)
    setIsMuted(audio.muted)
  }, [])

  useEffect(() => {
    return () => {
      detachAudioTrack()
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [])

  function detachAudioTrack() {
    if (attachedTrackRef.current) {
      attachedTrackRef.current.detach()
      attachedTrackRef.current = null
    }

    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.srcObject = null
      audio.load()
    }

    setIsPlaying(false)
    setIsBuffering(false)
  }

  function attachAudioTrack(track: RemoteTrack, participant: RemoteParticipant) {
    if (track.kind !== Track.Kind.Audio || !participant.identity.startsWith('speaker_')) {
      return
    }

    const audio = audioRef.current

    if (!audio || attachedTrackRef.current?.sid === track.sid) {
      return
    }

    detachAudioTrack()
    attachedTrackRef.current = track
    track.attach(audio)
    void audio.play().catch(() => {})
    setState('connected')
    setMessage(`Monitoring listener audio for ${channelName}.`)
    syncPlaybackState()
  }

  async function startMonitor() {
    if (webrtcEnabled === false) {
      setState('unavailable')
      setMessage('WebRTC is disabled for listeners on this channel.')
      return
    }

    stopMonitor(false)
    setState('connecting')
    setIsBuffering(true)
    setMessage('Connecting to the listener feed...')

    const response = await fetch('/api/livekit/listener-token', {
      body: JSON.stringify({ channelSlug, eventSlug }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const tokenResponse = (await response.json().catch(() => null)) as ListenerTokenResponse | null

    if (!response.ok || !tokenResponse?.token || !tokenResponse.url) {
      setState(response.status === 403 ? 'unavailable' : 'error')
      setIsBuffering(false)
      setMessage(tokenResponse?.error ?? 'Unable to connect to the listener feed right now.')
      return
    }

    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room

      room
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            attachAudioTrack(track, participant)
          },
        )
        .on(RoomEvent.Disconnected, () => {
          detachAudioTrack()
          setState('idle')
          setMessage('Stopped monitoring the listener feed.')
        })

      await room.connect(tokenResponse.url, tokenResponse.token, {
        autoSubscribe: true,
      })

      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (publication.track) {
            attachAudioTrack(publication.track, participant)
            break
          }
        }
      }

      setState('connected')
      setMessage(`Connected to ${channelName}. Waiting for live audio if no player appears yet.`)
    } catch (error) {
      console.error('Speaker listener monitor failed', error)
      const errorMessage = error instanceof Error ? error.message : null
      setState('error')
      setIsBuffering(false)
      setMessage(errorMessage ? `Listener monitor failed: ${errorMessage}` : 'Listener monitor failed.')
    }
  }

  function stopMonitor(updateMessage = true) {
    detachAudioTrack()
    roomRef.current?.disconnect()
    roomRef.current = null
    setState('idle')

    if (updateMessage) {
      setMessage('Stopped monitoring the listener feed.')
    }
  }

  return (
    <div className="rounded-3xl border bg-white/70 px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
        Listener monitor
      </p>
      <p className="mt-1 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Hear what listeners hear on this channel. Works even when the public listener link is password-protected or private.
        If the channel uses a speaker password, unlock publish controls first.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'connected' ? (
          <button type="button" className="us-button-primary px-4 py-2.5 text-sm font-medium" onClick={() => stopMonitor()}>
            Stop listening
          </button>
        ) : (
          <button
            type="button"
            className="us-button-primary px-4 py-2.5 text-sm font-medium"
            disabled={state === 'connecting'}
            onClick={startMonitor}
          >
            {state === 'connecting' ? 'Connecting...' : 'Listen here'}
          </button>
        )}
        {fallbackUrl ? (
          <a href={fallbackUrl} className="us-button-secondary px-4 py-2.5 text-sm font-medium" rel="noreferrer" target="_blank">
            Open fallback
          </a>
        ) : null}
      </div>
      {message ? (
        <p className="mt-3 text-sm leading-6" style={{ color: state === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {message}
        </p>
      ) : null}

      <audio ref={audioRef} className="hidden" playsInline preload="auto" />

      {showPlayer ? (
        <LiveAudioPlayerShell
          disabled={state === 'connecting'}
          isBuffering={isBuffering}
          isMuted={isMuted}
          isPlaying={isPlaying}
          label="Live"
          mode={`Monitoring ${channelName}`}
          onToggleMute={() => {
            const audio = audioRef.current
            if (audio) {
              audio.muted = !audio.muted
              setIsMuted(audio.muted)
            }
          }}
          onTogglePlayback={() => {
            const audio = audioRef.current
            if (!audio) {
              return
            }

            if (audio.paused) {
              void audio.play()
            } else {
              audio.pause()
            }

            syncPlaybackState()
          }}
        />
      ) : null}
    </div>
  )
}

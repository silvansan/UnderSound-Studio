'use client'

import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from 'livekit-client'
import { useEffect, useRef, useState } from 'react'

type SpeakerListenerMonitorProps = {
  channelName: string
  channelSlug: string
  eventSlug: string
  fallbackUrl?: string | null
  listenerPasswordEnabled?: boolean | null
  listenerTokenMode?: 'public' | 'password' | 'private' | null
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
  listenerPasswordEnabled,
  listenerTokenMode,
  webrtcEnabled,
}: SpeakerListenerMonitorProps) {
  const audioContainerRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<MonitorState>('idle')

  useEffect(() => {
    const audioContainer = audioContainerRef.current

    return () => {
      roomRef.current?.disconnect()
      roomRef.current = null
      audioContainer?.replaceChildren()
    }
  }, [])

  function attachAudioTrack(track: RemoteTrack) {
    if (track.kind !== Track.Kind.Audio || !audioContainerRef.current) {
      return
    }

    const element = track.attach()
    element.autoplay = true
    element.controls = true
    element.className = 'mt-3 w-full'
    audioContainerRef.current.append(element)
    setState('connected')
    setMessage(`Monitoring listener audio for ${channelName}.`)
  }

  function attachExistingAudio(room: Room) {
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          attachAudioTrack(publication.track)
        }
      })
    })
  }

  async function startMonitor() {
    if (webrtcEnabled === false) {
      setState('unavailable')
      setMessage('WebRTC is disabled for listeners on this channel.')
      return
    }

    if (listenerPasswordEnabled || listenerTokenMode === 'password' || listenerTokenMode === 'private') {
      setState('unavailable')
      setMessage('This listener channel is password/private, so inline monitoring is not available yet.')
      return
    }

    setState('connecting')
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
      setMessage(tokenResponse?.error ?? 'Unable to connect to the listener feed right now.')
      return
    }

    try {
      roomRef.current?.disconnect()
      audioContainerRef.current?.replaceChildren()

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room

      room
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
            attachAudioTrack(track)
          },
        )
        .on(RoomEvent.Disconnected, () => {
          setState('idle')
          setMessage('Stopped monitoring the listener feed.')
        })

      await room.connect(tokenResponse.url, tokenResponse.token, {
        autoSubscribe: true,
      })
      attachExistingAudio(room)
      setState('connected')
      setMessage(`Connected to ${channelName}. Waiting for live audio if no player appears yet.`)
    } catch (error) {
      console.error('Speaker listener monitor failed', error)
      const errorMessage = error instanceof Error ? error.message : null
      setState('error')
      setMessage(errorMessage ? `Listener monitor failed: ${errorMessage}` : 'Listener monitor failed.')
    }
  }

  function stopMonitor() {
    roomRef.current?.disconnect()
    roomRef.current = null
    audioContainerRef.current?.replaceChildren()
    setState('idle')
    setMessage('Stopped monitoring the listener feed.')
  }

  return (
    <div className="rounded-3xl border bg-white/70 px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
        Listener monitor
      </p>
      <p className="mt-1 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Subscribe as a listener from this speaker page to verify what listeners hear.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'connected' ? (
          <button type="button" className="us-button-primary px-4 py-2.5 text-sm font-medium" onClick={stopMonitor}>
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
      <div ref={audioContainerRef} />
    </div>
  )
}

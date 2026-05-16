'use client'

import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack, type RemoteTrackPublication } from 'livekit-client'
import { useEffect, useRef, useState } from 'react'

type ListenerConnectPanelProps = {
  channelName: string
  channelSlug: string
  eventSlug: string
  fallbackUrl?: string | null
  listenerTokenMode?: 'public' | 'password' | 'private' | null
  listenerPasswordEnabled?: boolean | null
  webrtcEnabled?: boolean | null
}

type ListenerTokenResponse = {
  token: string
  url: string
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'error'

export function ListenerConnectPanel({
  channelName,
  channelSlug,
  eventSlug,
  fallbackUrl,
  listenerPasswordEnabled,
  listenerTokenMode,
  webrtcEnabled,
}: ListenerConnectPanelProps) {
  const audioContainerRef = useRef<HTMLDivElement>(null)
  const roomRef = useRef<Room | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<ConnectionState>('idle')

  useEffect(() => {
    const audioContainer = audioContainerRef.current

    window.localStorage.setItem(
      'undersound:last-listener-channel',
      JSON.stringify({ channelSlug, eventSlug, savedAt: new Date().toISOString() }),
    )

    return () => {
      roomRef.current?.disconnect()
      roomRef.current = null
      audioContainer?.replaceChildren()
    }
  }, [channelSlug, eventSlug])

  function attachAudioTrack(track: RemoteTrack) {
    if (track.kind !== Track.Kind.Audio || !audioContainerRef.current) {
      return
    }

    const element = track.attach()
    element.autoplay = true
    element.controls = true
    element.className = 'mt-4 w-full'
    audioContainerRef.current.append(element)
    setState('connected')
      setMessage(`Connected to ${channelName}. Audio will play when a speaker is live.`)
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

  async function connect() {
    if (webrtcEnabled === false) {
      setState('unavailable')
      setMessage('WebRTC is disabled for this channel. Use the fallback link if one is available.')
      return
    }

    if (listenerPasswordEnabled || listenerTokenMode === 'password' || listenerTokenMode === 'private') {
      setState('unavailable')
      setMessage('This listener channel is not public yet. Password/private listener flow will be added later.')
      return
    }

    setState('connecting')
    setMessage('Requesting listener token...')

    const response = await fetch('/api/livekit/listener-token', {
      body: JSON.stringify({ channelSlug, eventSlug }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      setState(response.status === 403 ? 'unavailable' : 'error')
      setMessage('Unable to connect to this listener channel right now.')
      return
    }

    const { token, url } = (await response.json()) as ListenerTokenResponse

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
          setMessage('Disconnected from the listener channel.')
        })

      await room.connect(url, token, {
        autoSubscribe: true,
      })
      attachExistingAudio(room)
      setState('connected')
      setMessage(`Connected to ${channelName}. Waiting for live audio if no player appears yet.`)
    } catch (error) {
      console.error('Listener WebRTC connection failed', error)
      setState('error')
      setMessage('The WebRTC connection failed. Try again or use the fallback link if available.')
    }
  }

  const buttonLabel =
    state === 'connecting' ? 'Connecting...' : state === 'connected' ? 'Reconnect WebRTC' : 'Connect with WebRTC'

  return (
    <div className="mt-6">
      <button
        type="button"
        className="us-button-primary w-full px-6 py-4 text-lg font-semibold"
        disabled={state === 'connecting'}
        onClick={connect}
      >
        {buttonLabel}
      </button>
      {message ? (
        <p className="mt-4 text-sm leading-6" style={{ color: state === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {message}
        </p>
      ) : null}
      <div ref={audioContainerRef} />
      {fallbackUrl ? (
        <a
          href={fallbackUrl}
          className="us-button-secondary mt-4 inline-flex w-full justify-center px-6 py-3 text-sm font-medium"
          rel="noreferrer"
          target="_blank"
        >
          Open fallback stream
        </a>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="us-chip us-chip-muted">Primary: WebRTC</span>
        {fallbackUrl ? (
          <span className="us-chip us-chip-blue">Fallback configured</span>
        ) : (
          <span className="us-chip us-chip-muted">No fallback configured</span>
        )}
      </div>
    </div>
  )
}

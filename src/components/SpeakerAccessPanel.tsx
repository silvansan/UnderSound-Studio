'use client'

import { Room, RoomEvent } from 'livekit-client'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

type SpeakerAccessPanelProps = {
  audioQualityDefaults?: AudioQualityControls
  channelSlug: string
  eventSlug: string
  hasAccess: boolean
  passwordRequired: boolean
}

type AudioQualityControls = {
  autoGainControl: boolean
  echoCancellation: boolean
  noiseSuppression: boolean
}

type SpeakerTokenResponse = {
  error?: string
  token: string
  url: string
}

type PublishState = 'idle' | 'loading-devices' | 'connecting' | 'publishing' | 'error'

export function SpeakerAccessPanel({
  audioQualityDefaults,
  channelSlug,
  eventSlug,
  hasAccess: initialHasAccess,
  passwordRequired,
}: SpeakerAccessPanelProps) {
  const roomRef = useRef<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(initialHasAccess || !passwordRequired)
  const [loading, setLoading] = useState(false)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [publishState, setPublishState] = useState<PublishState>('idle')
  const [password, setPassword] = useState('')
  const [selectedDeviceID, setSelectedDeviceID] = useState('')
  const [audioQuality, setAudioQuality] = useState<AudioQualityControls>({
    autoGainControl: audioQualityDefaults?.autoGainControl ?? false,
    echoCancellation: audioQualityDefaults?.echoCancellation ?? false,
    noiseSuppression: audioQualityDefaults?.noiseSuppression ?? false,
  })

  const audioConstraints = useCallback((deviceID?: string): MediaTrackConstraints => {
    return {
      autoGainControl: audioQuality.autoGainControl,
      deviceId: deviceID ? { exact: deviceID } : undefined,
      echoCancellation: audioQuality.echoCancellation,
      noiseSuppression: audioQuality.noiseSuppression,
    }
  }, [audioQuality])

  function updateAudioQuality(key: keyof AudioQualityControls, value: boolean) {
    setAudioQuality((current) => ({
      ...current,
      [key]: value,
    }))
  }

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect()
      roomRef.current = null
    }
  }, [])

  const loadMicrophones = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setPublishState('error')
      setPublishMessage('This browser does not expose microphone device selection.')
      return
    }

    setPublishState('loading-devices')
    setPublishMessage('Loading microphones...')

    try {
      await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints(),
      })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((device) => device.kind === 'audioinput')
      setMicrophones(audioInputs)
      setSelectedDeviceID((current) => current || audioInputs[0]?.deviceId || '')
      setPublishState('idle')
      setPublishMessage(audioInputs.length > 0 ? 'Choose a microphone, then start publishing.' : 'No microphone was found.')
    } catch (loadError) {
      console.error('Unable to load microphones', loadError)
      setPublishState('error')
      setPublishMessage('Microphone permission was denied or no microphone is available.')
    }
  }, [audioConstraints])

  useEffect(() => {
    if (hasAccess) {
      void loadMicrophones()
    }
  }, [hasAccess, loadMicrophones])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch('/api/speaker/verify-password', {
      body: JSON.stringify({
        channelSlug,
        eventSlug,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    setLoading(false)

    if (!response.ok) {
      setError('That speaker password did not work. Check it and try again.')
      return
    }

    setHasAccess(true)
    setPassword('')
  }

  async function startPublishing() {
    if (!selectedDeviceID) {
      setPublishState('error')
      setPublishMessage('Select a microphone before publishing.')
      return
    }

    setPublishState('connecting')
    setPublishMessage('Requesting speaker token...')

    const response = await fetch('/api/livekit/speaker-token', {
      body: JSON.stringify({
        channelSlug,
        eventSlug,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const tokenResponse = (await response.json().catch(() => null)) as SpeakerTokenResponse | null

    if (!response.ok || !tokenResponse?.token || !tokenResponse.url) {
      setPublishState('error')
      setPublishMessage(tokenResponse?.error ?? 'Unable to get a speaker token for this channel.')
      return
    }

    const { token, url } = tokenResponse

    try {
      roomRef.current?.disconnect()

      const room = new Room({
        audioCaptureDefaults: audioConstraints(),
      })
      roomRef.current = room

      room.on(RoomEvent.Disconnected, () => {
        setPublishState('idle')
        setPublishMessage('Disconnected from the speaker channel.')
      })

      await room.connect(url, token, {
        autoSubscribe: true,
      })

      await room.localParticipant.setMicrophoneEnabled(
        true,
        audioConstraints(selectedDeviceID),
        {
          name: 'speaker-microphone',
        },
      )

      setPublishState('publishing')
      setPublishMessage('Publishing microphone audio with the selected audio quality controls.')
    } catch (publishError) {
      console.error('Speaker publishing failed', publishError)
      const message = publishError instanceof Error ? publishError.message : null
      roomRef.current?.disconnect()
      roomRef.current = null
      setPublishState('error')
      setPublishMessage(
        message
          ? `Publishing failed: ${message}`
          : 'Publishing failed. Check microphone permissions, LiveKit settings, and channel availability.',
      )
    }
  }

  function stopPublishing() {
    roomRef.current?.disconnect()
    roomRef.current = null
    setPublishState('idle')
    setPublishMessage('Publishing stopped.')
  }

  if (!hasAccess) {
    return (
      <article className="us-panel px-6 py-7">
        <span className="us-chip us-chip-warning">Speaker password required</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
          Enter the speaker password
        </h2>
        <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
          This password only unlocks the speaker page for this event/channel. It is separate from Payload user login.
        </p>
        <form onSubmit={submitPassword} className="mt-5 space-y-3">
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Speaker password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
              type="password"
              value={password}
            />
          </label>
          {error ? (
            <p className="text-sm" style={{ color: 'var(--us-danger)' }}>
              {error}
            </p>
          ) : null}
          <button disabled={loading} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
            {loading ? 'Checking...' : 'Unlock speaker controls'}
          </button>
        </form>
      </article>
    )
  }

  return (
    <article className="us-panel px-6 py-7">
      <span className="us-chip us-chip-blue">Speaker access ready</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
        Publish controls
      </h2>
      <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
        Select the microphone to publish to this channel. Browser echo cancellation, noise suppression, and auto gain
        control stay off by default, to preserve music and natural source audio.
      </p>
      <label className="mt-5 block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Microphone
        <select
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          disabled={publishState === 'connecting' || publishState === 'publishing'}
          onChange={(event) => setSelectedDeviceID(event.target.value)}
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          value={selectedDeviceID}
        >
          {microphones.length === 0 ? <option value="">No microphone loaded</option> : null}
          {microphones.map((device, index) => (
            <option key={device.deviceId || index} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="us-button-secondary px-5 py-3 text-sm font-medium"
          disabled={publishState === 'loading-devices' || publishState === 'connecting' || publishState === 'publishing'}
          onClick={loadMicrophones}
        >
          Refresh microphones
        </button>
        {publishState === 'publishing' ? (
          <button type="button" className="us-button-primary px-5 py-3 text-sm font-medium" onClick={stopPublishing}>
            Stop publishing
          </button>
        ) : (
          <button
            type="button"
            className="us-button-primary px-5 py-3 text-sm font-medium"
            disabled={publishState === 'loading-devices' || publishState === 'connecting'}
            onClick={startPublishing}
          >
            {publishState === 'connecting' ? 'Starting...' : 'Start publishing audio'}
          </button>
        )}
      </div>
      {publishMessage ? (
        <p className="mt-4 text-sm leading-6" style={{ color: publishState === 'error' ? 'var(--us-danger)' : 'var(--us-muted)' }}>
          {publishMessage}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Audio quality controls
        </p>
        <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
          These affect this speaker session only. Stop publishing before changing them.
        </p>
        <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--us-text)' }}>
          {[
            ['echoCancellation', 'Echo cancellation', 'Off by default to avoid music distortion'],
            ['noiseSuppression', 'Noise suppression', 'Off by default for natural source audio'],
            ['autoGainControl', 'Auto gain control', 'Off by default to preserve dynamics'],
          ].map(([key, label, hint]) => (
            <label key={label} className="flex items-start gap-3 rounded-2xl bg-white/70 px-3 py-3">
              <input
                checked={audioQuality[key as keyof AudioQualityControls]}
                className="mt-1"
                disabled={publishState === 'publishing' || publishState === 'connecting'}
                onChange={(event) => updateAudioQuality(key as keyof AudioQualityControls, event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block font-medium">{label}</span>
                <span className="block text-xs" style={{ color: 'var(--us-muted)' }}>
                  {hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </article>
  )
}

'use client'

import { FormEvent, useState } from 'react'

type SpeakerAccessPanelProps = {
  channelSlug: string
  eventSlug: string
  hasAccess: boolean
  passwordRequired: boolean
}

export function SpeakerAccessPanel({
  channelSlug,
  eventSlug,
  hasAccess: initialHasAccess,
  passwordRequired,
}: SpeakerAccessPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(initialHasAccess || !passwordRequired)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

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
        LiveKit publishing will use the server token endpoint from Phase 7. The browser audio capture controls below
        are prepared for the upcoming speaker UI and should default to music-safe settings.
      </p>
      <button type="button" className="us-button-primary mt-5 w-full px-5 py-3 text-sm font-medium">
        Start publishing audio
      </button>

      <div className="mt-6 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Future audio quality controls
        </p>
        <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--us-text)' }}>
          {[
            ['Echo cancellation', 'Off by default to avoid music distortion'],
            ['Noise suppression', 'Off by default for natural source audio'],
            ['Auto gain control', 'Off by default to preserve dynamics'],
          ].map(([label, hint]) => (
            <label key={label} className="flex items-start gap-3 rounded-2xl bg-white/70 px-3 py-3">
              <input className="mt-1" disabled type="checkbox" />
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

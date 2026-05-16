'use client'

import { FormEvent, useState } from 'react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/users/forgot-password', {
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setLoading(false)

      if (!response.ok) {
        setError('We could not start a reset for that email. Check it and try again.')
        return
      }

      setSent(true)
    } catch {
      setLoading(false)
      setError('Password reset did not finish. Check the server connection and try again.')
    }
  }

  return (
    <form onSubmit={submitForgotPassword} className="space-y-4">
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Account email
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          disabled={sent}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="email"
          value={email}
        />
      </label>

      {sent ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
          If that email exists, a password reset link has been sent.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {error}
        </p>
      ) : null}

      <button disabled={loading || sent} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
        {loading ? 'Sending reset link...' : sent ? 'Reset link sent' : 'Send reset link'}
      </button>
    </form>
  )
}

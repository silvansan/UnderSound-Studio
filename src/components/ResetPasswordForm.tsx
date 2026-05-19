'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [reset, setReset] = useState(false)

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use at least 8 characters for the new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('The password confirmation does not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/app/reset-password', {
        body: JSON.stringify({ password, token }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setLoading(false)

      if (!response.ok) {
        setError('This reset link did not work. It may have expired.')
        return
      }

      setReset(true)
      setPassword('')
      setConfirmPassword('')
    } catch {
      setLoading(false)
      setError('Password reset did not finish. Check the server connection and try again.')
    }
  }

  if (reset) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
          Your password has been reset. You can sign in now.
        </p>
        <Link href="/" className="us-button-primary inline-flex px-5 py-3 text-sm font-medium">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submitResetPassword} className="space-y-4">
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        New password
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="password"
          value={password}
        />
      </label>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Confirm password
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
          type="password"
          value={confirmPassword}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {error}
        </p>
      ) : null}

      <button disabled={loading} type="submit" className="us-button-primary w-full px-5 py-3 text-sm font-medium">
        {loading ? 'Resetting password...' : 'Reset password'}
      </button>
    </form>
  )
}

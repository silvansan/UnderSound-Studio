import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { completeUserActivation } from '@/lib/user-activation'
import { rateLimitRequest } from '@/lib/rate-limit'

type ResetPasswordBody = {
  password?: unknown
  token?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'reset-password', {
    limit: 5,
    windowMs: 10 * 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  let body: ResetPasswordBody = {}

  try {
    body = (await request.json()) as ResetPasswordBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const password = parseString(body.password)
  const token = parseString(body.token)

  if (!password || !token) {
    return NextResponse.json({ error: 'password and token are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: {
        password,
        token,
      },
      overrideAccess: true,
    })

    const userID = result?.user?.id

    if (userID !== undefined && userID !== null) {
      await completeUserActivation(payload, userID as number | string)
    }

    return NextResponse.json({ message: 'Password reset successfully.' })
  } catch {
    return NextResponse.json({ error: 'This reset link did not work. It may have expired.' }, { status: 400 })
  }
}

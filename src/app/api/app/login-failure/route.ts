import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { getLoginFailureReason, loginFailureMessage } from '@/lib/user-activation'
import { rateLimitRequest } from '@/lib/rate-limit'

type LoginFailureBody = {
  email?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'login-failure', {
    limit: 20,
    windowMs: 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  let body: LoginFailureBody = {}

  try {
    body = (await request.json()) as LoginFailureBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = parseString(body.email)?.toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const reason = await getLoginFailureReason(payload, email)

  return NextResponse.json({
    error: loginFailureMessage(reason),
    reason: reason ?? 'invalid',
  })
}

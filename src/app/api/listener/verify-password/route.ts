import { NextResponse } from 'next/server'

import { shouldUseSecureCookies } from '@/lib/cookies'
import {
  createListenerSessionToken,
  getListenerSessionCookieName,
  listenerPasswordRequired,
  listenerSessionMaxAgeSeconds,
  verifyContextListenerPassword,
} from '@/lib/listener-password'
import { getPublicChannelContext, isListenerPubliclyAvailable } from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'

type VerifyListenerPasswordBody = {
  channelSlug?: unknown
  eventSlug?: unknown
  password?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function readBody(request: Request): Promise<VerifyListenerPasswordBody> {
  try {
    return (await request.json()) as VerifyListenerPasswordBody
  } catch {
    return {}
  }
}

function sessionPayload(eventSlug: string, channelSlug: string, required: boolean) {
  const listenerSessionToken = createListenerSessionToken(eventSlug, channelSlug)

  return {
    expiresIn: listenerSessionMaxAgeSeconds,
    listenerSessionToken,
    ok: true,
    required,
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'listener-password', {
    limit: 10,
    windowMs: 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  const body = await readBody(request)
  const eventSlug = parseString(body.eventSlug)
  const channelSlug = parseString(body.channelSlug)

  if (!eventSlug || !channelSlug) {
    return NextResponse.json({ error: 'eventSlug and channelSlug are required' }, { status: 400 })
  }

  const context = await getPublicChannelContext(eventSlug, channelSlug)

  if (!context || !isListenerPubliclyAvailable(context)) {
    return NextResponse.json({ error: 'Listener channel not found' }, { status: 404 })
  }

  const required = listenerPasswordRequired(context)

  if (!required) {
    return NextResponse.json(sessionPayload(eventSlug, channelSlug, false))
  }

  const password = parseString(body.password)

  if (!password) {
    return NextResponse.json({ error: 'Listener password is required' }, { status: 400 })
  }

  const verified = await verifyContextListenerPassword(context, password)

  if (!verified) {
    return NextResponse.json({ error: 'Invalid listener password' }, { status: 401 })
  }

  const response = NextResponse.json(sessionPayload(eventSlug, channelSlug, true))
  response.cookies.set({
    httpOnly: true,
    maxAge: listenerSessionMaxAgeSeconds,
    name: getListenerSessionCookieName(eventSlug, channelSlug),
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    value: createListenerSessionToken(eventSlug, channelSlug),
  })

  return response
}

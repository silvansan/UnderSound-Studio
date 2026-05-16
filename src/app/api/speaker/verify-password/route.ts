import { NextResponse } from 'next/server'

import { shouldUseSecureCookies } from '@/lib/cookies'
import { getPublicChannelContext, isSpeakerPubliclyAvailable } from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'
import {
  createSpeakerSessionToken,
  getSpeakerSessionCookieName,
  speakerPasswordRequired,
  speakerSessionMaxAgeSeconds,
  verifyContextSpeakerPassword,
} from '@/lib/speaker-password'

type VerifySpeakerPasswordBody = {
  channelSlug?: unknown
  eventSlug?: unknown
  password?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function readBody(request: Request): Promise<VerifySpeakerPasswordBody> {
  try {
    return (await request.json()) as VerifySpeakerPasswordBody
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'speaker-password', {
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

  if (!context || !isSpeakerPubliclyAvailable(context)) {
    return NextResponse.json({ error: 'Speaker channel not found' }, { status: 404 })
  }

  const password = parseString(body.password)

  if (speakerPasswordRequired(context) && !password) {
    return NextResponse.json({ error: 'Speaker password is required' }, { status: 400 })
  }

  const verified = await verifyContextSpeakerPassword(context, password ?? '')

  if (!verified) {
    return NextResponse.json({ error: 'Invalid speaker password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    httpOnly: true,
    maxAge: speakerSessionMaxAgeSeconds,
    name: getSpeakerSessionCookieName(eventSlug, channelSlug),
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    value: createSpeakerSessionToken(eventSlug, channelSlug),
  })

  return response
}

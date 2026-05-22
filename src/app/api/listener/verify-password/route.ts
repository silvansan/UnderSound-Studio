import { NextResponse } from 'next/server'

import { shouldUseSecureCookies } from '@/lib/cookies'
import {
  createEventListenerSessionToken,
  createListenerSessionToken,
  getEventListenerSessionCookieName,
  getListenerSessionCookieName,
  listenerPasswordRequired,
  listenerSessionMaxAgeSeconds,
  verifyContextListenerPassword,
} from '@/lib/listener-password'
import {
  buildPublicEventDirectoryResponse,
  eventDirectoryPasswordRequired,
  getPublicChannelContext,
  getPublicEventBySlug,
  isListenerPubliclyAvailable,
} from '@/lib/public-channel'
import { getRequestBaseUrl } from '@/lib/links'
import { verifySpeakerPassword } from '@/lib/speaker-password'
import { rateLimitRequest } from '@/lib/rate-limit'

type VerifyListenerPasswordBody = {
  channelSlug?: unknown
  directory?: unknown
  eventSlug?: unknown
  password?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 'on'
}

async function readBody(request: Request): Promise<VerifyListenerPasswordBody> {
  try {
    return (await request.json()) as VerifyListenerPasswordBody
  } catch {
    return {}
  }
}

function channelSessionPayload(eventSlug: string, channelSlug: string, required: boolean) {
  const listenerSessionToken = createListenerSessionToken(eventSlug, channelSlug)

  return {
    expiresIn: listenerSessionMaxAgeSeconds,
    listenerSessionToken,
    ok: true,
    required,
    scope: 'channel' as const,
  }
}

function eventSessionPayload(eventSlug: string, required: boolean) {
  const listenerSessionToken = createEventListenerSessionToken(eventSlug)

  return {
    expiresIn: listenerSessionMaxAgeSeconds,
    listenerSessionToken,
    ok: true,
    required,
    scope: 'event' as const,
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
  const directory = parseBoolean(body.directory)

  if (!eventSlug) {
    return NextResponse.json({ error: 'eventSlug is required' }, { status: 400 })
  }

  if (directory) {
    const publicBaseUrl = await getRequestBaseUrl()
    const eventDirectory = await buildPublicEventDirectoryResponse(eventSlug, publicBaseUrl)

    if (!eventDirectory) {
      return NextResponse.json({ error: 'Event listener directory not found' }, { status: 404 })
    }

    const required = eventDirectoryPasswordRequired({
      listenerPasswordEnabled: eventDirectory.event.listenerPasswordEnabled,
    })

    if (!required) {
      return NextResponse.json(eventSessionPayload(eventSlug, false))
    }

    const password = parseString(body.password)

    if (!password) {
      return NextResponse.json({ error: 'Listener password is required' }, { status: 400 })
    }

    const event = await getPublicEventBySlug(eventSlug)
    const directoryVerified = event ? await verifySpeakerPassword(password, event.listenerPasswordHash) : false

    if (!directoryVerified) {
      return NextResponse.json({ error: 'Invalid listener password' }, { status: 401 })
    }

    const response = NextResponse.json(eventSessionPayload(eventSlug, true))
    response.cookies.set({
      httpOnly: true,
      maxAge: listenerSessionMaxAgeSeconds,
      name: getEventListenerSessionCookieName(eventSlug),
      path: '/',
      sameSite: 'lax',
      secure: shouldUseSecureCookies(),
      value: createEventListenerSessionToken(eventSlug),
    })

    return response
  }

  if (!channelSlug) {
    return NextResponse.json({ error: 'channelSlug is required' }, { status: 400 })
  }

  const context = await getPublicChannelContext(eventSlug, channelSlug)

  if (!context || !isListenerPubliclyAvailable(context)) {
    return NextResponse.json({ error: 'Listener channel not found' }, { status: 404 })
  }

  const required = listenerPasswordRequired(context)

  if (!required) {
    return NextResponse.json(channelSessionPayload(eventSlug, channelSlug, false))
  }

  const password = parseString(body.password)

  if (!password) {
    return NextResponse.json({ error: 'Listener password is required' }, { status: 400 })
  }

  const verified = await verifyContextListenerPassword(context, password)

  if (!verified) {
    return NextResponse.json({ error: 'Invalid listener password' }, { status: 401 })
  }

  const response = NextResponse.json(channelSessionPayload(eventSlug, channelSlug, true))
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

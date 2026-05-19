import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createListenerToken, createLiveKitIdentity, getBrowserLiveKitURL } from '@/lib/livekit'
import {
  LISTENER_SESSION_HEADER,
  getListenerSessionCookieName,
  listenerPasswordRequired,
  resolveListenerSessionToken,
} from '@/lib/listener-password'
import {
  canIssueListenerTokenForSpeakerMonitor,
  getPublicChannelContext,
  isListenerPubliclyAvailable,
  isListenerTokenAvailable,
} from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'
import { getSpeakerSessionCookieName, verifySpeakerSessionToken } from '@/lib/speaker-password'

type TokenRequestBody = {
  channelSlug?: unknown
  eventSlug?: unknown
  identity?: unknown
  listenerSessionToken?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function readBody(request: Request): Promise<TokenRequestBody> {
  try {
    return (await request.json()) as TokenRequestBody
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'livekit-listener-token', {
    limit: 30,
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

  if (!context) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }

  const cookieStore = await cookies()
  const listenerSessionCookie = cookieStore.get(getListenerSessionCookieName(eventSlug, channelSlug))?.value
  const speakerSessionCookie = cookieStore.get(getSpeakerSessionCookieName(eventSlug, channelSlug))?.value
  const hasSpeakerSession = verifySpeakerSessionToken(eventSlug, channelSlug, speakerSessionCookie)
  const hasListenerSession = Boolean(
    resolveListenerSessionToken(eventSlug, channelSlug, {
      bodyToken: parseString(body.listenerSessionToken),
      cookieToken: listenerSessionCookie,
      headerToken: request.headers.get(LISTENER_SESSION_HEADER),
    }),
  )
  const passwordRequired = listenerPasswordRequired(context)
  const canIssueToken =
    isListenerTokenAvailable(context) ||
    (isListenerPubliclyAvailable(context) && passwordRequired && hasListenerSession) ||
    canIssueListenerTokenForSpeakerMonitor(context, hasSpeakerSession)

  if (!canIssueToken) {
    const error = passwordRequired
      ? 'Listener password is required. Verify the password before requesting a token.'
      : context.channel.listenerTokenMode === 'private'
        ? 'This listener channel is private.'
        : 'Listener token is not available for this channel.'

    return NextResponse.json({ error }, { status: 403 })
  }

  try {
    const token = await createListenerToken(
      context.roomName,
      parseString(body.identity) ?? createLiveKitIdentity('listener'),
      context.tokenExpiry,
      getBrowserLiveKitURL(request),
    )

    return NextResponse.json(token)
  } catch (error) {
    console.error('Failed to create listener LiveKit token', error)

    return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 503 })
  }
}

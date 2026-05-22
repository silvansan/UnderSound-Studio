import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createListenerToken, createLiveKitIdentity, getBrowserLiveKitURL, getLiveKitBrowserUrlErrorMessage, logLiveKitBrowserUrlResolution } from '@/lib/livekit'
import {
  LISTENER_SESSION_HEADER,
  getEventListenerSessionCookieName,
  getListenerSessionCookieName,
  listenerPasswordRequired,
  resolveListenerSessionToken,
} from '@/lib/listener-password'
import {
  canIssueListenerTokenForSpeakerCrossMonitor,
  canIssueListenerTokenForSpeakerMonitor,
  getPublicChannelContext,
  isListenerPubliclyAvailable,
  isListenerTokenAvailable,
} from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'
import { getSpeakerSessionCookieName, verifySpeakerSessionToken } from '@/lib/speaker-password'

type TokenRequestBody = {
  channelSlug?: unknown
  eventListenerSessionToken?: unknown
  eventSlug?: unknown
  identity?: unknown
  listenerSessionToken?: unknown
  speakerPublishChannelSlug?: unknown
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
  try {
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
    const speakerPublishChannelSlug = parseString(body.speakerPublishChannelSlug) ?? channelSlug

    if (!eventSlug || !channelSlug || !speakerPublishChannelSlug) {
      return NextResponse.json({ error: 'eventSlug and channelSlug are required' }, { status: 400 })
    }

    const context = await getPublicChannelContext(eventSlug, channelSlug)

    if (!context) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const cookieStore = await cookies()
    const listenerSessionCookie = cookieStore.get(getListenerSessionCookieName(eventSlug, channelSlug))?.value
    const eventListenerSessionCookie = cookieStore.get(getEventListenerSessionCookieName(eventSlug))?.value
    const speakerSessionCookie = cookieStore.get(getSpeakerSessionCookieName(eventSlug, speakerPublishChannelSlug))?.value
    const hasSpeakerSession = verifySpeakerSessionToken(eventSlug, speakerPublishChannelSlug, speakerSessionCookie)
    const hasListenerSession = Boolean(
      resolveListenerSessionToken(eventSlug, channelSlug, {
        bodyToken: parseString(body.listenerSessionToken),
        cookieToken: listenerSessionCookie,
        eventScopeToken: eventListenerSessionCookie || parseString(body.eventListenerSessionToken),
        headerToken: request.headers.get(LISTENER_SESSION_HEADER),
      }),
    )
    const passwordRequired = listenerPasswordRequired(context)
    const sameChannelSpeakerMonitor =
      channelSlug === speakerPublishChannelSlug &&
      canIssueListenerTokenForSpeakerMonitor(context, hasSpeakerSession)
    const crossChannelSpeakerMonitor = canIssueListenerTokenForSpeakerCrossMonitor(context, hasSpeakerSession)
    const canIssueToken =
      isListenerTokenAvailable(context) ||
      (isListenerPubliclyAvailable(context) && passwordRequired && hasListenerSession) ||
      sameChannelSpeakerMonitor ||
      crossChannelSpeakerMonitor

    if (!canIssueToken) {
      const error = passwordRequired
        ? 'Listener password is required. Verify the password before requesting a token.'
        : context.channel.listenerTokenMode === 'private'
          ? 'This listener channel is private.'
          : 'Listener token is not available for this channel.'

      return NextResponse.json({ error }, { status: 403 })
    }

    const browserUrl = getBrowserLiveKitURL(request, context.settings.livekitPublicUrl)
    logLiveKitBrowserUrlResolution(request, context.settings.livekitPublicUrl)

    if (!browserUrl) {
      return NextResponse.json({ error: getLiveKitBrowserUrlErrorMessage() }, { status: 503 })
    }

    const token = await createListenerToken(
      context.roomName,
      parseString(body.identity) ?? createLiveKitIdentity('listener'),
      context.tokenExpiry,
      browserUrl,
    )

    return NextResponse.json(token)
  } catch (error) {
    console.error('Failed to create listener LiveKit token', error)

    return NextResponse.json({ error: 'LiveKit is not configured or temporarily unavailable' }, { status: 503 })
  }
}

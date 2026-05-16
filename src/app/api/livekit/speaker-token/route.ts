import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createLiveKitIdentity, createSpeakerToken } from '@/lib/livekit'
import { getPublicChannelContext, isSpeakerPubliclyAvailable, isSpeakerTokenAvailable } from '@/lib/public-channel'
import {
  getSpeakerSessionCookieName,
  speakerPasswordRequired,
  verifySpeakerSessionToken,
} from '@/lib/speaker-password'

type TokenRequestBody = {
  canSubscribe?: unknown
  channelSlug?: unknown
  eventSlug?: unknown
  identity?: unknown
}

function parseBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
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

  const speakerCookies = await cookies()
  const sessionCookie = speakerCookies.get(getSpeakerSessionCookieName(eventSlug, channelSlug))?.value
  const hasSpeakerSession =
    speakerPasswordRequired(context) && verifySpeakerSessionToken(eventSlug, channelSlug, sessionCookie)
  const canIssueToken =
    isSpeakerTokenAvailable(context) || (isSpeakerPubliclyAvailable(context) && hasSpeakerSession)

  if (!canIssueToken) {
    return NextResponse.json({ error: 'Speaker token is not available for this channel' }, { status: 403 })
  }

  try {
    const token = await createSpeakerToken(
      context.roomName,
      parseString(body.identity) ?? createLiveKitIdentity('speaker'),
      context.tokenExpiry,
      parseBoolean(body.canSubscribe) ?? true,
    )

    return NextResponse.json(token)
  } catch (error) {
    console.error('Failed to create speaker LiveKit token', error)

    return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 503 })
  }
}

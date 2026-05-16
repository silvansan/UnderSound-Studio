import { NextResponse } from 'next/server'

import { createListenerToken, createLiveKitIdentity, getBrowserLiveKitURL } from '@/lib/livekit'
import { getPublicChannelContext, isListenerTokenAvailable } from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'

type TokenRequestBody = {
  channelSlug?: unknown
  eventSlug?: unknown
  identity?: unknown
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

  if (!isListenerTokenAvailable(context)) {
    return NextResponse.json({ error: 'Listener token is not available for this channel' }, { status: 403 })
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

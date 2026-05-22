import { NextResponse } from 'next/server'

import {
  getPublicChannelContext,
  isListenerPubliclyAvailable,
  toPublicChannelResponse,
} from '@/lib/public-channel'

type RouteContext = {
  params: Promise<{ channelSlug: string; eventSlug: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const { channelSlug, eventSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)

  if (!context || !isListenerPubliclyAvailable(context)) {
    return NextResponse.json({ error: 'Listener channel not found' }, { status: 404 })
  }

  return NextResponse.json(toPublicChannelResponse(context, '/api/livekit/listener-token', request))
}

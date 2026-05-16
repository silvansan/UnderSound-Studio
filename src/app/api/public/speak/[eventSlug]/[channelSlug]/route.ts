import { NextResponse } from 'next/server'

import {
  getPublicChannelContext,
  isSpeakerPubliclyAvailable,
  toPublicChannelResponse,
} from '@/lib/public-channel'

type RouteContext = {
  params: Promise<{ channelSlug: string; eventSlug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { channelSlug, eventSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)

  if (!context || !isSpeakerPubliclyAvailable(context)) {
    return NextResponse.json({ error: 'Speaker channel not found' }, { status: 404 })
  }

  return NextResponse.json(toPublicChannelResponse(context, '/api/livekit/speaker-token'))
}

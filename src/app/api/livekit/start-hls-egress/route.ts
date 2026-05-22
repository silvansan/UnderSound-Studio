import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { ensureChannelHlsEgress } from '@/lib/egress-controller'
import { getPublicChannelContext, isSpeakerPubliclyAvailable, isSpeakerTokenAvailable } from '@/lib/public-channel'
import { rateLimitRequest } from '@/lib/rate-limit'
import {
  getSpeakerSessionCookieName,
  speakerPasswordRequired,
  verifySpeakerSessionToken,
} from '@/lib/speaker-password'

type StartEgressRequestBody = {
  audioTrackId?: unknown
  channelSlug?: unknown
  eventSlug?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function readBody(request: Request): Promise<StartEgressRequestBody> {
  try {
    return (await request.json()) as StartEgressRequestBody
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'livekit-start-hls-egress', {
    limit: 20,
    windowMs: 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  const body = await readBody(request)
  const eventSlug = parseString(body.eventSlug)
  const channelSlug = parseString(body.channelSlug)
  const audioTrackId = parseString(body.audioTrackId)

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
  const canStartEgress =
    isSpeakerTokenAvailable(context) || (isSpeakerPubliclyAvailable(context) && hasSpeakerSession)

  if (!canStartEgress) {
    return NextResponse.json({ error: 'Speaker access is required to start LL-HLS egress' }, { status: 403 })
  }

  try {
    await ensureChannelHlsEgress(context.channel, context.event, context.roomName, context.settings, {
      audioTrackId,
    })

    const refreshed = await getPublicChannelContext(eventSlug, channelSlug)

    return NextResponse.json({
      hlsEgressStatus: refreshed?.channel.hlsEgressStatus ?? 'idle',
      ok: refreshed?.channel.hlsEgressStatus === 'live' || refreshed?.channel.hlsEgressStatus === 'starting',
    })
  } catch (error) {
    console.error('Failed to start LL-HLS egress', error)

    return NextResponse.json({ error: 'Unable to start LL-HLS egress' }, { status: 503 })
  }
}

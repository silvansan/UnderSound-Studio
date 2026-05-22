import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { restartChannelHlsEgress } from '@/lib/egress-controller'
import { getRequestBaseUrl } from '@/lib/links'
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
import { buildHlsManifestUrl, resolveChannelHlsUrl, resolveHlsPublicBaseUrl, resolveHlsPlaylistName } from '@/lib/streaming/build-hls-url'
import { getSpeakerSessionCookieName, verifySpeakerSessionToken } from '@/lib/speaker-password'

type RestartEgressRequestBody = {
  channelSlug?: unknown
  eventSlug?: unknown
  listenerSessionToken?: unknown
  eventListenerSessionToken?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function readBody(request: Request): Promise<RestartEgressRequestBody> {
  try {
    return (await request.json()) as RestartEgressRequestBody
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'livekit-restart-hls-egress', {
    limit: 12,
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

  if (context.channel.hlsEnabled !== true) {
    return NextResponse.json({ error: 'LL-HLS is not enabled for this channel' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const listenerSessionCookie = cookieStore.get(getListenerSessionCookieName(eventSlug, channelSlug))?.value
  const eventListenerSessionCookie = cookieStore.get(getEventListenerSessionCookieName(eventSlug))?.value
  const speakerSessionCookie = cookieStore.get(getSpeakerSessionCookieName(eventSlug, channelSlug))?.value
  const hasSpeakerSession = verifySpeakerSessionToken(eventSlug, channelSlug, speakerSessionCookie)
  const hasListenerSession = Boolean(
    resolveListenerSessionToken(eventSlug, channelSlug, {
      bodyToken: parseString(body.listenerSessionToken),
      cookieToken: listenerSessionCookie,
      eventScopeToken: eventListenerSessionCookie || parseString(body.eventListenerSessionToken),
      headerToken: request.headers.get(LISTENER_SESSION_HEADER),
    }),
  )
  const passwordRequired = listenerPasswordRequired(context)
  const canRestart =
    isListenerTokenAvailable(context) ||
    (isListenerPubliclyAvailable(context) && passwordRequired && hasListenerSession) ||
    canIssueListenerTokenForSpeakerMonitor(context, hasSpeakerSession) ||
    canIssueListenerTokenForSpeakerCrossMonitor(context, hasSpeakerSession)

  if (!canRestart) {
    const error = passwordRequired
      ? 'Listener password is required before restarting LL-HLS.'
      : context.channel.listenerTokenMode === 'private'
        ? 'This listener channel is private.'
        : 'Listener access is required to restart LL-HLS.'

    return NextResponse.json({ error }, { status: 403 })
  }

  try {
    const requestBaseUrl = await getRequestBaseUrl()
    await restartChannelHlsEgress(context.channel, context.event, context.roomName, context.settings)
    const refreshed = await getPublicChannelContext(eventSlug, channelSlug)

    if (!refreshed) {
      return NextResponse.json({ error: 'Channel not found after restart' }, { status: 404 })
    }

    const hlsUrl =
      resolveChannelHlsUrl(refreshed.channel, refreshed.event, refreshed.settings, requestBaseUrl) ??
      buildHlsManifestUrl(
        refreshed.event.slug,
        refreshed.channel.slug,
        resolveHlsPublicBaseUrl(refreshed.settings, requestBaseUrl),
        resolveHlsPlaylistName(refreshed.settings),
      )
    const hlsEgressStatus = refreshed.channel.hlsEgressStatus ?? 'idle'

    return NextResponse.json({
      hlsEgressStatus,
      hlsUrl,
      ok: hlsEgressStatus === 'live' || hlsEgressStatus === 'starting',
    })
  } catch (error) {
    console.error('Failed to restart LL-HLS egress', error)

    return NextResponse.json({ error: 'Unable to restart LL-HLS egress' }, { status: 503 })
  }
}

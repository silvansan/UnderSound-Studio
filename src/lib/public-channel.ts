import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getListenerAccessInfo } from '@/lib/listener-password'
import type { Channel, Event, SiteSetting } from '@/payload-types'

export type PublicChannelContext = {
  channel: Channel
  event: Event
  roomName: string
  settings: SiteSetting
  tokenExpiry: number
}

export type PublicChannelResponse = {
  access: {
    listenerPasswordConfigured: boolean
    listenerPasswordMissing: boolean
    listenerPasswordRequired: boolean
    listenerTokenMode: 'password' | 'private' | 'public'
    listenerUnavailable: boolean
    verifyPasswordEndpoint: string
  }
  channel: {
    description?: string | null
    enabled?: boolean | null
    hlsEnabled?: boolean | null
    icecastFallbackUrl?: string | null
    languageCode?: string | null
    languageLabel?: string | null
    listenerPageEnabled?: boolean | null
    listenerTokenMode?: 'public' | 'password' | 'private' | null
    name: string
    slug: string
    speakerPageEnabled?: boolean | null
    speakerPasswordEnabled?: boolean | null
    webrtcEnabled?: boolean | null
  }
  event: {
    defaultLanguage?: string | null
    listenerPasswordEnabled?: boolean | null
    publicListenerEnabled?: boolean | null
    slug: string
    speakerPasswordEnabled?: boolean | null
    status?: 'draft' | 'active' | 'archived' | null
    title: string
  }
  livekit: {
    roomName: string
    tokenEndpoint: string
    url?: string | null
  }
}

const DEFAULT_TOKEN_EXPIRY_SECONDS = 3600

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export async function getPublicChannelContext(
  eventSlug: string,
  channelSlug: string,
): Promise<PublicChannelContext | null> {
  const payload = await getPayload({ config: configPromise })

  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: eventSlug,
      },
    },
  })
  const event = events.docs[0]

  if (!event) {
    return null
  }

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          slug: {
            equals: channelSlug,
          },
        },
      ],
    },
  })
  const channel = channels.docs[0]

  if (!channel) {
    return null
  }

  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const tokenExpiry = isPositiveNumber(settings.defaultTokenExpiry)
    ? settings.defaultTokenExpiry
    : DEFAULT_TOKEN_EXPIRY_SECONDS

  return {
    channel,
    event,
    roomName: channel.livekitRoomName || channel.roomName || `ablaut_${event.slug}_${channel.slug}`,
    settings,
    tokenExpiry,
  }
}

export function toPublicChannelResponse(
  context: PublicChannelContext,
  tokenEndpoint: '/api/livekit/listener-token' | '/api/livekit/speaker-token',
): PublicChannelResponse {
  const { channel, event, roomName, settings } = context

  return {
    access: getListenerAccessInfo(context),
    channel: {
      description: channel.description,
      enabled: channel.enabled,
      hlsEnabled: channel.hlsEnabled,
      icecastFallbackUrl: channel.icecastFallbackUrl,
      languageCode: channel.languageCode,
      languageLabel: channel.languageLabel,
      listenerPageEnabled: channel.listenerPageEnabled,
      listenerTokenMode: channel.listenerTokenMode,
      name: channel.name,
      slug: channel.slug,
      speakerPageEnabled: channel.speakerPageEnabled,
      speakerPasswordEnabled: channel.speakerPasswordEnabled,
      webrtcEnabled: channel.webrtcEnabled,
    },
    event: {
      defaultLanguage: event.defaultLanguage,
      listenerPasswordEnabled: event.listenerPasswordEnabled,
      publicListenerEnabled: event.publicListenerEnabled,
      slug: event.slug,
      speakerPasswordEnabled: event.speakerPasswordEnabled,
      status: event.status,
      title: event.title,
    },
    livekit: {
      roomName,
      tokenEndpoint,
      url: settings.livekitPublicUrl || process.env.LIVEKIT_URL || null,
    },
  }
}

export function isListenerPubliclyAvailable(context: PublicChannelContext): boolean {
  return (
    context.event.status === 'active' &&
    context.event.publicListenerEnabled !== false &&
    context.settings.allowPublicListenerPages !== false &&
    context.channel.enabled !== false &&
    context.channel.listenerPageEnabled !== false
  )
}

export function isListenerTokenAvailable(context: PublicChannelContext): boolean {
  return (
    isListenerPubliclyAvailable(context) &&
    context.event.listenerPasswordEnabled !== true &&
    context.channel.listenerTokenMode !== 'password' &&
    context.channel.listenerTokenMode !== 'private'
  )
}

export function isSpeakerPubliclyAvailable(context: PublicChannelContext): boolean {
  return (
    context.event.status === 'active' &&
    context.channel.enabled !== false &&
    context.channel.speakerPageEnabled !== false
  )
}

export function isSpeakerTokenAvailable(context: PublicChannelContext): boolean {
  return (
    isSpeakerPubliclyAvailable(context) &&
    context.event.speakerPasswordEnabled !== true &&
    context.channel.speakerPasswordEnabled !== true
  )
}

/** Speaker-page inline monitor: subscribe-only, bypasses listener password/private gates. */
export function canIssueListenerTokenForSpeakerMonitor(
  context: PublicChannelContext,
  hasSpeakerSession: boolean,
): boolean {
  return (
    isSpeakerPubliclyAvailable(context) &&
    context.channel.webrtcEnabled !== false &&
    hasSpeakerSession
  )
}

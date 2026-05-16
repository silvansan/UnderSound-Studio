import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Channel, Event } from '@/payload-types'

export type DashboardChannel = Pick<
  Channel,
  | 'description'
  | 'enabled'
  | 'hlsEnabled'
  | 'icecastFallbackUrl'
  | 'languageCode'
  | 'languageLabel'
  | 'listenerPageEnabled'
  | 'livekitRoomName'
  | 'name'
  | 'roomName'
  | 'slug'
  | 'speakerPageEnabled'
  | 'sortOrder'
  | 'updatedAt'
  | 'webrtcEnabled'
>

export type DashboardEvent = Pick<
  Event,
  | 'dateEnd'
  | 'dateStart'
  | 'defaultLanguage'
  | 'description'
  | 'location'
  | 'publicListenerEnabled'
  | 'slug'
  | 'status'
  | 'title'
  | 'updatedAt'
> & {
  channelCount: number
}

export type DashboardSummary = {
  activeEvents: number
  archivedEvents: number
  draftEvents: number
  recentChannels: (DashboardChannel & { eventSlug: string })[]
  recentEvents: DashboardEvent[]
  totalChannels: number
}

function normalizeEvent(event: Event, channelCount = 0): DashboardEvent {
  return {
    channelCount,
    dateEnd: event.dateEnd,
    dateStart: event.dateStart,
    defaultLanguage: event.defaultLanguage,
    description: event.description,
    location: event.location,
    publicListenerEnabled: event.publicListenerEnabled,
    slug: event.slug,
    status: event.status,
    title: event.title,
    updatedAt: event.updatedAt,
  }
}

function normalizeChannel(channel: Channel): DashboardChannel {
  return {
    description: channel.description,
    enabled: channel.enabled,
    hlsEnabled: channel.hlsEnabled,
    icecastFallbackUrl: channel.icecastFallbackUrl,
    languageCode: channel.languageCode,
    languageLabel: channel.languageLabel,
    listenerPageEnabled: channel.listenerPageEnabled,
    livekitRoomName: channel.livekitRoomName,
    name: channel.name,
    roomName: channel.roomName,
    slug: channel.slug,
    speakerPageEnabled: channel.speakerPageEnabled,
    sortOrder: channel.sortOrder,
    updatedAt: channel.updatedAt,
    webrtcEnabled: channel.webrtcEnabled,
  }
}

async function getChannelCount(eventID: number): Promise<number> {
  const payload = await getPayload({ config: configPromise })
  const channels = await payload.count({
    collection: 'channels',
    overrideAccess: true,
    where: {
      event: {
        equals: eventID,
      },
    },
  })

  return channels.totalDocs
}

export async function getDashboardEvents(limit = 100): Promise<DashboardEvent[]> {
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    sort: '-updatedAt',
  })

  return Promise.all(events.docs.map(async (event) => normalizeEvent(event, await getChannelCount(event.id))))
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const payload = await getPayload({ config: configPromise })
  const [events, channels] = await Promise.all([
    getDashboardEvents(6),
    payload.find({
      collection: 'channels',
      depth: 1,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
    }),
  ])

  const allEvents = await getDashboardEvents(1000)

  return {
    activeEvents: allEvents.filter((event) => event.status === 'active').length,
    archivedEvents: allEvents.filter((event) => event.status === 'archived').length,
    draftEvents: allEvents.filter((event) => event.status === 'draft').length,
    recentChannels: channels.docs.map((channel) => {
      const event = typeof channel.event === 'object' ? channel.event : null

      return {
        ...normalizeChannel(channel),
        eventSlug: event?.slug ?? String(channel.event),
      }
    }),
    recentEvents: events,
    totalChannels: channels.totalDocs,
  }
}

export async function getDashboardEvent(eventSlug: string): Promise<DashboardEvent | null> {
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

  return normalizeEvent(event, await getChannelCount(event.id))
}

export async function getDashboardChannels(eventSlug: string): Promise<DashboardChannel[]> {
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
    return []
  }

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: {
      event: {
        equals: event.id,
      },
    },
  })

  return channels.docs.map(normalizeChannel)
}

export async function getDashboardChannel(
  eventSlug: string,
  channelSlug: string,
): Promise<(DashboardChannel & { event: DashboardEvent }) | null> {
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    return null
  }

  const channels = await getDashboardChannels(eventSlug)
  const channel = channels.find((candidate) => candidate.slug === channelSlug)

  if (!channel) {
    return null
  }

  return {
    ...channel,
    event,
  }
}

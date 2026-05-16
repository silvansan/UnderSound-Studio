import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { Channel, Event, SiteSetting, User } from '@/payload-types'

export type ConfigExportScope = 'channels' | 'events' | 'full'

type ExportedEvent = Pick<
  Event,
  | 'dateEnd'
  | 'dateStart'
  | 'defaultLanguage'
  | 'description'
  | 'listenerPasswordEnabled'
  | 'listenerPasswordHash'
  | 'location'
  | 'publicListenerEnabled'
  | 'qrSettings'
  | 'slug'
  | 'speakerPasswordEnabled'
  | 'speakerPasswordHash'
  | 'status'
  | 'themeOverride'
  | 'title'
>

type ExportedChannel = Pick<
  Channel,
  | 'description'
  | 'enabled'
  | 'hlsEnabled'
  | 'icecastFallbackUrl'
  | 'languageCode'
  | 'languageLabel'
  | 'listenerPageEnabled'
  | 'listenerTokenMode'
  | 'livekitRoomName'
  | 'name'
  | 'roomName'
  | 'slug'
  | 'sortOrder'
  | 'speakerPageEnabled'
  | 'speakerPasswordEnabled'
  | 'speakerPasswordHash'
  | 'webrtcEnabled'
> & {
  eventSlug: string
}

type ExportedSiteSettings = Partial<
  Pick<
    SiteSetting,
    | 'allowPublicListenerPages'
    | 'defaultQrStyle'
    | 'defaultThemeColors'
    | 'defaultTokenExpiry'
    | 'livekitPublicUrl'
    | 'publicBaseUrl'
    | 'requireEmailVerification'
    | 'siteName'
    | 'supportEmail'
  >
>

export type UnderSoundConfigExport = {
  channels?: ExportedChannel[]
  events?: ExportedEvent[]
  exportedAt: string
  kind: 'undersound-config'
  settings?: ExportedSiteSettings
  version: 1
}

function assertCanTransferConfig(user: User | null | undefined, scope: ConfigExportScope) {
  if (scope === 'full') {
    if (!isSuperAdminUser(user)) {
      throw new Error('Only super admins can transfer full site config.')
    }

    return
  }

  if (!isAdminUser(user)) {
    throw new Error('Only admins can transfer event and channel config.')
  }
}

function normalizeScope(value: string | null | undefined): ConfigExportScope {
  if (value === 'channels' || value === 'full') {
    return value
  }

  return 'events'
}

function eventConfig(event: Event): ExportedEvent {
  return {
    dateEnd: event.dateEnd,
    dateStart: event.dateStart,
    defaultLanguage: event.defaultLanguage,
    description: event.description,
    listenerPasswordEnabled: event.listenerPasswordEnabled,
    listenerPasswordHash: event.listenerPasswordHash,
    location: event.location,
    publicListenerEnabled: event.publicListenerEnabled,
    qrSettings: event.qrSettings,
    slug: event.slug,
    speakerPasswordEnabled: event.speakerPasswordEnabled,
    speakerPasswordHash: event.speakerPasswordHash,
    status: event.status,
    themeOverride: event.themeOverride,
    title: event.title,
  }
}

function channelConfig(channel: Channel): ExportedChannel {
  const event = typeof channel.event === 'object' ? channel.event : null

  return {
    description: channel.description,
    enabled: channel.enabled,
    eventSlug: event?.slug ?? String(channel.event),
    hlsEnabled: channel.hlsEnabled,
    icecastFallbackUrl: channel.icecastFallbackUrl,
    languageCode: channel.languageCode,
    languageLabel: channel.languageLabel,
    listenerPageEnabled: channel.listenerPageEnabled,
    listenerTokenMode: channel.listenerTokenMode,
    livekitRoomName: channel.livekitRoomName,
    name: channel.name,
    roomName: channel.roomName,
    slug: channel.slug,
    sortOrder: channel.sortOrder,
    speakerPageEnabled: channel.speakerPageEnabled,
    speakerPasswordEnabled: channel.speakerPasswordEnabled,
    speakerPasswordHash: channel.speakerPasswordHash,
    webrtcEnabled: channel.webrtcEnabled,
  }
}

function settingsConfig(settings: SiteSetting): ExportedSiteSettings {
  return {
    allowPublicListenerPages: settings.allowPublicListenerPages,
    defaultQrStyle: settings.defaultQrStyle,
    defaultThemeColors: settings.defaultThemeColors,
    defaultTokenExpiry: settings.defaultTokenExpiry,
    livekitPublicUrl: settings.livekitPublicUrl,
    publicBaseUrl: settings.publicBaseUrl,
    requireEmailVerification: settings.requireEmailVerification,
    siteName: settings.siteName,
    supportEmail: settings.supportEmail,
  }
}

export async function exportUnderSoundConfig(user: User, scopeValue?: string | null): Promise<UnderSoundConfigExport> {
  const scope = normalizeScope(scopeValue)
  assertCanTransferConfig(user, scope)

  const payload = await getPayload({ config: configPromise })
  const output: UnderSoundConfigExport = {
    exportedAt: new Date().toISOString(),
    kind: 'undersound-config',
    version: 1,
  }

  if (scope === 'events' || scope === 'full') {
    const events = await payload.find({
      collection: 'events',
      depth: 0,
      limit: 1000,
      overrideAccess: scope === 'full',
      pagination: false,
      sort: 'slug',
      user,
    })

    output.events = events.docs.map(eventConfig)
  }

  if (scope === 'channels' || scope === 'full') {
    const channels = await payload.find({
      collection: 'channels',
      depth: 1,
      limit: 2000,
      overrideAccess: scope === 'full',
      pagination: false,
      sort: ['event', 'sortOrder', 'slug'],
      user,
    })

    output.channels = channels.docs.map(channelConfig)
  }

  if (scope === 'full') {
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
    })

    output.settings = settingsConfig(settings)
  }

  return output
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asExportedEvent(value: unknown): ExportedEvent | null {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.slug !== 'string') {
    return null
  }

  return value as ExportedEvent
}

function asExportedChannel(value: unknown): ExportedChannel | null {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.eventSlug !== 'string'
  ) {
    return null
  }

  return value as ExportedChannel
}

function isExportedEvent(value: ExportedEvent | null): value is ExportedEvent {
  return value !== null
}

function isExportedChannel(value: ExportedChannel | null): value is ExportedChannel {
  return value !== null
}

export async function importUnderSoundConfig(user: User, input: unknown, scopeValue?: string | null) {
  const scope = normalizeScope(scopeValue)
  assertCanTransferConfig(user, scope)

  if (!isRecord(input) || input.kind !== 'undersound-config') {
    throw new Error('Import file is not an UnderSound config export.')
  }

  const payload = await getPayload({ config: configPromise })
  const events = Array.isArray(input.events) ? input.events.map(asExportedEvent).filter(isExportedEvent) : []
  const channels = Array.isArray(input.channels) ? input.channels.map(asExportedChannel).filter(isExportedChannel) : []

  if ((scope === 'events' || scope === 'full') && events.length > 0) {
    for (const event of events) {
      const existing = await payload.find({
        collection: 'events',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          slug: {
            equals: event.slug,
          },
        },
      })

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'events',
          data: event,
          overrideAccess: scope === 'full',
          user,
        })
      } else {
        await payload.create({
          collection: 'events',
          data: event,
          overrideAccess: scope === 'full',
          user,
        })
      }
    }
  }

  if ((scope === 'channels' || scope === 'full') && channels.length > 0) {
    for (const channel of channels) {
      const event = await payload.find({
        collection: 'events',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          slug: {
            equals: channel.eventSlug,
          },
        },
      })
      const targetEvent = event.docs[0]

      if (!targetEvent) {
        continue
      }

      const existing = await payload.find({
        collection: 'channels',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          and: [
            {
              event: {
                equals: targetEvent.id,
              },
            },
            {
              slug: {
                equals: channel.slug,
              },
            },
          ],
        },
      })

      const { eventSlug: _eventSlug, ...channelData } = channel

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'channels',
          data: {
            ...channelData,
            event: targetEvent.id,
          },
          overrideAccess: scope === 'full',
          user,
        })
      } else {
        await payload.create({
          collection: 'channels',
          data: {
            ...channelData,
            event: targetEvent.id,
          },
          overrideAccess: scope === 'full',
          user,
        })
      }
    }
  }

  if (scope === 'full' && isRecord(input.settings)) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: input.settings,
      overrideAccess: true,
    })
  }
}

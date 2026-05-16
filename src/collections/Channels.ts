import type { CollectionConfig, PayloadRequest } from 'payload'

import { canCreateChannel } from '@/access/canCreateChannel'
import { canManageChannel } from '@/access/canManageChannel'
import { canReadChannel } from '@/access/canReadChannel'
import { writeAuditLog } from '@/lib/audit'
import { getLiveKitRoomName } from '@/lib/livekit'
import { hashSpeakerPassword } from '@/lib/speaker-password'

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

async function syncEventChannels(req: PayloadRequest, eventID: number | string | null | undefined) {
  const comparableEventID = normalizeRelationshipID(eventID)

  if (!comparableEventID) {
    return
  }

  const channels = await req.payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      event: {
        equals: comparableEventID,
      },
    },
  })

  await req.payload.update({
    collection: 'events',
    id: comparableEventID,
    data: {
      channels: channels.docs.map((channel) => channel.id),
    },
    overrideAccess: true,
    req,
  })
}

export const Channels: CollectionConfig = {
  slug: 'channels',
  access: {
    create: canCreateChannel,
    delete: canManageChannel,
    read: canReadChannel,
    update: canManageChannel,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'event', 'enabled', 'sortOrder', 'createdBy'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'event',
              type: 'relationship',
              relationTo: 'events',
              required: true,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              index: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'languageCode',
                  type: 'text',
                },
                {
                  name: 'languageLabel',
                  type: 'text',
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'sortOrder',
                  type: 'number',
                  defaultValue: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Streaming',
          fields: [
            {
              name: 'roomName',
              type: 'text',
              admin: {
                description: 'Compatibility room name if older clients depend on it.',
              },
            },
            {
              name: 'livekitRoomName',
              type: 'text',
              admin: {
                description: 'Server-side LiveKit room name.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'webrtcEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'hlsEnabled',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'icecastFallbackUrl',
              type: 'text',
            },
          ],
        },
        {
          label: 'Access',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'listenerPageEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'speakerPageEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
            {
              name: 'listenerTokenMode',
              type: 'select',
              defaultValue: 'public',
              options: [
                { label: 'Public', value: 'public' },
                { label: 'Password', value: 'password' },
                { label: 'Private', value: 'private' },
              ],
            },
            {
              name: 'speakerPasswordEnabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'speakerPassword',
              type: 'text',
              virtual: true,
              admin: {
                description: 'Enter a new channel-level speaker password. Only a secure hash is stored.',
              },
            },
            {
              name: 'speakerPasswordHash',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await syncEventChannels(req, doc.event)

        const previousEventID = normalizeRelationshipID(previousDoc?.event)
        const nextEventID = normalizeRelationshipID(doc.event)

        if (previousEventID && previousEventID !== nextEventID) {
          await syncEventChannels(req, previousEventID)
        }

        if (previousDoc?.speakerPasswordHash !== doc.speakerPasswordHash) {
          await writeAuditLog(req.payload, {
            action: 'speaker_password.changed',
            channel: doc.id,
            collection: 'channels',
            documentId: doc.id,
            event: normalizeRelationshipID(doc.event),
            metadata: {
              name: doc.name,
              scope: 'channel',
              slug: doc.slug,
            },
            user: req.user,
          })
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await syncEventChannels(req, doc.event)
        await writeAuditLog(req.payload, {
          action: 'channel.deleted',
          channel: doc.id,
          collection: 'channels',
          documentId: doc.id,
          event: normalizeRelationshipID(doc.event),
          metadata: {
            name: doc.name,
            slug: doc.slug,
          },
          user: req.user,
        })
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        const nextData = { ...data }

        if (typeof nextData.name === 'string' && !nextData.slug) {
          nextData.slug = formatSlug(nextData.name)
        }

        if (typeof nextData.slug === 'string') {
          nextData.slug = formatSlug(nextData.slug)
        }

        if (operation === 'create' && req.user?.id && !nextData.createdBy) {
          nextData.createdBy = req.user.id
        }

        if (typeof nextData.speakerPassword === 'string' && nextData.speakerPassword.trim().length > 0) {
          nextData.speakerPasswordHash = await hashSpeakerPassword(nextData.speakerPassword)
        }

        delete nextData.speakerPassword

        const eventID = normalizeRelationshipID(nextData.event)

        if (eventID && (!nextData.roomName || !nextData.livekitRoomName)) {
          const event = await req.payload.findByID({
            collection: 'events',
            id: eventID,
            overrideAccess: true,
            req,
          })

          const eventSlug =
            typeof event.slug === 'string' && event.slug.length > 0 ? event.slug : String(eventID)
          const channelSlug =
            typeof nextData.slug === 'string' && nextData.slug.length > 0
              ? nextData.slug
              : typeof nextData.name === 'string'
                ? formatSlug(nextData.name)
                : 'channel'
          const defaultRoomName = getLiveKitRoomName(eventSlug, channelSlug)

          if (!nextData.roomName) {
            nextData.roomName = defaultRoomName
          }

          if (!nextData.livekitRoomName) {
            nextData.livekitRoomName = defaultRoomName
          }
        }

        return nextData
      },
    ],
  },
}

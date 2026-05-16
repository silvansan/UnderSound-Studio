import type { CollectionConfig } from 'payload'

import { canManageEvent } from '@/access/canManageEvent'
import { canReadEvent } from '@/access/canReadEvent'
import { isAdmin } from '@/access/isAdmin'
import { writeAuditLog } from '@/lib/audit'
import { hashSpeakerPassword } from '@/lib/speaker-password'

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: isAdmin,
    delete: canManageEvent,
    read: canReadEvent,
    update: canManageEvent,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'dateStart', 'dateEnd', 'createdBy', 'updatedAt'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Active', value: 'active' },
                { label: 'Archived', value: 'archived' },
              ],
            },
            {
              name: 'eventLogo',
              type: 'relationship',
              relationTo: 'media',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'dateStart',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'dateEnd',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              name: 'location',
              type: 'text',
            },
            {
              name: 'defaultLanguage',
              type: 'text',
              defaultValue: 'en',
            },
          ],
        },
        {
          label: 'Access',
          fields: [
            {
              name: 'publicListenerEnabled',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'listenerPasswordEnabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'listenerPasswordHash',
              type: 'text',
              admin: {
                hidden: true,
              },
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
                description: 'Enter a new event-level speaker password. Only a secure hash is stored.',
              },
            },
            {
              name: 'speakerPasswordHash',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'assignedAdmins',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              admin: {
                readOnly: true,
                description: 'Derived from event assignments.',
              },
              filterOptions: {
                role: {
                  in: ['admin', 'super_admin'],
                },
              },
            },
            {
              name: 'assignedModerators',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              admin: {
                readOnly: true,
                description: 'Derived from event assignments.',
              },
              filterOptions: {
                role: {
                  equals: 'moderator',
                },
              },
            },
          ],
        },
        {
          label: 'Channels',
          fields: [
            {
              name: 'channels',
              type: 'relationship',
              relationTo: 'channels',
              hasMany: true,
              admin: {
                readOnly: true,
                description: 'Automatically synchronized from the Channels collection.',
              },
            },
          ],
        },
        {
          label: 'QR and Theme',
          fields: [
            {
              name: 'qrSettings',
              type: 'group',
              fields: [
                {
                  name: 'foregroundColor',
                  type: 'text',
                  defaultValue: '#1a3d2e',
                },
                {
                  name: 'backgroundColor',
                  type: 'text',
                  defaultValue: '#ffffff',
                },
                {
                  name: 'includeBlueAccent',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'themeOverride',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'greenDark',
                  type: 'text',
                },
                {
                  name: 'green',
                  type: 'text',
                },
                {
                  name: 'greenLight',
                  type: 'text',
                },
                {
                  name: 'blue',
                  type: 'text',
                },
                {
                  name: 'blueDark',
                  type: 'text',
                },
                {
                  name: 'background',
                  type: 'text',
                },
                {
                  name: 'card',
                  type: 'text',
                },
                {
                  name: 'text',
                  type: 'text',
                },
              ],
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
    beforeChange: [
      async ({ data, operation, req }) => {
        const nextData = { ...data }

        if (typeof nextData.title === 'string' && !nextData.slug) {
          nextData.slug = formatSlug(nextData.title)
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

        return nextData
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation === 'update' && previousDoc?.speakerPasswordHash !== doc.speakerPasswordHash) {
          await writeAuditLog(req.payload, {
            action: 'speaker_password.changed',
            collection: 'events',
            documentId: doc.id,
            event: doc.id,
            metadata: {
              scope: 'event',
              title: doc.title,
            },
            user: req.user,
          })
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await writeAuditLog(req.payload, {
          action: 'event.deleted',
          collection: 'events',
          documentId: doc.id,
          event: doc.id,
          metadata: {
            slug: doc.slug,
            title: doc.title,
          },
          user: req.user,
        })
      },
    ],
  },
}

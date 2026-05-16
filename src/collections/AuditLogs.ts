import type { CollectionConfig } from 'payload'

import { isSuperAdmin } from '@/access/isSuperAdmin'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  access: {
    create: () => false,
    delete: () => false,
    read: isSuperAdmin,
    update: () => false,
  },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'user', 'collection', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'collection',
      type: 'text',
    },
    {
      name: 'documentId',
      type: 'text',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'channel',
      type: 'relationship',
      relationTo: 'channels',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}

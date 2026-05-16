import type { CollectionConfig } from 'payload'

export const EventAssignments: CollectionConfig = {
  slug: 'event-assignments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'event', 'roleForEvent'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'roleForEvent',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
  ],
}

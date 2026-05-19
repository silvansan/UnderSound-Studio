import type { CollectionConfig, Where } from 'payload'

import { isSuperAdminUser } from '@/lib/permissions'
import { getManageableOrganizationIDs, isOrganizationManagerRole } from '@/lib/organizations'

export const OrganizationMemberships: CollectionConfig = {
  slug: 'organization-memberships',
  access: {
    create: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const organizationIDs = await getManageableOrganizationIDs(req)

      if (organizationIDs === null) {
        return true
      }

      if (organizationIDs.length === 0) {
        return false
      }

      return {
        organization: {
          in: organizationIDs,
        },
      } as Where
    },
    delete: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const organizationIDs = await getManageableOrganizationIDs(req)

      if (organizationIDs === null) {
        return true
      }

      if (organizationIDs.length === 0) {
        return false
      }

      return {
        organization: {
          in: organizationIDs,
        },
      } as Where
    },
    read: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const userID = req.user?.id

      if (!userID) {
        return false
      }

      const organizationIDs = await getManageableOrganizationIDs(req)

      if (organizationIDs === null) {
        return true
      }

      return {
        or: [
          {
            user: {
              equals: userID,
            },
          },
          ...(organizationIDs.length > 0
            ? [
                {
                  organization: {
                    in: organizationIDs,
                  },
                },
              ]
            : []),
        ],
      } as Where
    },
    update: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const organizationIDs = await getManageableOrganizationIDs(req)

      if (organizationIDs === null) {
        return true
      }

      if (organizationIDs.length === 0) {
        return false
      }

      return {
        organization: {
          in: organizationIDs,
        },
      } as Where
    },
  },
  admin: {
    defaultColumns: ['organization', 'user', 'roleInOrganization', 'status', 'updatedAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'roleInOrganization',
      type: 'select',
      required: true,
      defaultValue: 'moderator',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Manager', value: 'manager' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Revoked', value: 'revoked' },
      ],
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'invitedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'requestedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'revokedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        const nextData = { ...data }
        const nextStatus = nextData.status ?? originalDoc?.status

        if (operation === 'create' && nextStatus === 'active' && !nextData.approvedAt) {
          nextData.approvedAt = new Date().toISOString()
          nextData.approvedBy = req.user?.id
        }

        if (
          operation === 'update' &&
          nextData.status === 'active' &&
          originalDoc?.status !== 'active' &&
          !nextData.approvedAt
        ) {
          nextData.approvedAt = new Date().toISOString()
          nextData.approvedBy = req.user?.id
        }

        if (
          operation === 'update' &&
          nextData.status === 'revoked' &&
          originalDoc?.status !== 'revoked' &&
          !nextData.revokedAt
        ) {
          nextData.revokedAt = new Date().toISOString()
        }

        if (operation === 'create' && nextData.invitedBy === undefined && req.user?.id) {
          const role = nextData.roleInOrganization ?? 'moderator'

          if (isOrganizationManagerRole(role) || nextStatus === 'pending') {
            nextData.invitedBy = req.user.id
            nextData.invitedAt = new Date().toISOString()
          }
        }

        return nextData
      },
    ],
  },
}

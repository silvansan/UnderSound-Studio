import { APIError, type CollectionConfig, type Where } from 'payload'

import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
  generateVerificationEmailHTML,
  generateVerificationEmailSubject,
} from '@/lib/email'
import { shouldUseSecureCookies } from '@/lib/cookies'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => isSuperAdminUser(req.user),
    create: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      if (isAdminUser(req.user)) {
        return {
          role: {
            equals: 'moderator',
          },
        } as Where
      }

      return false
    },
    read: ({ req }) => {
      const userID = req.user?.id

      if (isSuperAdminUser(req.user)) {
        return true
      }

      if (isAdminUser(req.user)) {
        return {
          role: {
            equals: 'moderator',
          },
        } as Where
      }

      if (!userID) {
        return false
      }

      return {
        id: {
          equals: userID,
        },
      } as Where
    },
    update: ({ req }) => {
      const userID = req.user?.id

      if (isSuperAdminUser(req.user)) {
        return true
      }

      if (isAdminUser(req.user)) {
        return {
          role: {
            not_equals: 'super_admin',
          },
        } as Where
      }

      if (!userID) {
        return false
      }

      return {
        id: {
          equals: userID,
        },
      } as Where
    },
  },
  admin: {
    defaultColumns: ['email', 'name', 'role', 'active', 'lastLogin', 'updatedAt'],
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      sameSite: 'Lax',
      secure: shouldUseSecureCookies(),
    },
    forgotPassword: {
      expiration: 1000 * 60 * 60,
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
    lockTime: 1000 * 60 * 15,
    maxLoginAttempts: 5,
    tokenExpiration: 60 * 60 * 2,
    useAPIKey: false,
    useSessions: true,
    verify: {
      generateEmailHTML: generateVerificationEmailHTML,
      generateEmailSubject: generateVerificationEmailSubject,
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'moderator',
      access: {
        create: ({ req }) => isSuperAdminUser(req.user),
        update: ({ req }) => isSuperAdminUser(req.user),
      },
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
      ],
      saveToJWT: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: ({ req }) => isSuperAdminUser(req.user),
        update: ({ req }) => isSuperAdminUser(req.user),
      },
      saveToJWT: true,
    },
    {
      name: 'preferredLanguage',
      type: 'text',
      defaultValue: 'en',
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'collapsible',
      label: 'Invitation',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'invitationStatus',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Pending', value: 'pending' },
            { label: 'Accepted', value: 'accepted' },
            { label: 'Expired', value: 'expired' },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'invitedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'invitationAcceptedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'invitedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Two-factor authentication preparation',
      admin: {
        description: 'Phase 11 only prepares fields. Full 2FA must be implemented carefully before enabling enforcement.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'twoFactorEnabled',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Reserved for a future 2FA flow.',
          },
        },
        {
          name: 'twoFactorMethod',
          type: 'select',
          options: [
            { label: 'Authenticator app', value: 'app' },
            { label: 'Email code', value: 'email' },
          ],
          admin: {
            description: 'Reserved for future 2FA method selection.',
          },
        },
        {
          name: 'twoFactorSecret',
          type: 'text',
          admin: {
            description: 'Reserved for an encrypted future 2FA secret. Do not populate until encryption is implemented.',
            hidden: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user && 'active' in user && user.active === false) {
          throw new APIError('This account is inactive. Contact a super admin for access.')
        }

        return user
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && isAdminUser(req.user) && !isSuperAdminUser(req.user)) {
          return {
            ...data,
            role: 'moderator',
          }
        }

        return data
      },
    ],
  },
}

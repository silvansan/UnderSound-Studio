import type { GlobalConfig } from 'payload'

import { isSuperAdmin } from '@/access/isSuperAdmin'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: isSuperAdmin,
    update: isSuperAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              defaultValue: 'ablaut',
            },
            {
              name: 'defaultLogo',
              type: 'relationship',
              relationTo: 'media',
            },
            {
              name: 'publicBaseUrl',
              type: 'text',
            },
            {
              name: 'supportEmail',
              type: 'email',
            },
          ],
        },
        {
          label: 'Access',
          fields: [
            {
              name: 'allowPublicListenerPages',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'requireEmailVerification',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'defaultTokenExpiry',
              type: 'number',
              defaultValue: 3600,
              min: 300,
            },
          ],
        },
        {
          label: 'LiveKit and QR',
          fields: [
            {
              name: 'livekitPublicUrl',
              type: 'text',
            },
            {
              name: 'defaultQrStyle',
              type: 'select',
              defaultValue: 'ablaut-default',
              options: [
                { label: 'ablaut default', value: 'ablaut-default' },
                { label: 'High Contrast', value: 'high-contrast' },
              ],
            },
          ],
        },
        {
          label: 'Theme',
          fields: [
            {
              name: 'defaultThemeColors',
              type: 'group',
              fields: [
                {
                  name: 'greenDark',
                  type: 'text',
                  defaultValue: '#1a3d2e',
                },
                {
                  name: 'green',
                  type: 'text',
                  defaultValue: '#2d6a4f',
                },
                {
                  name: 'greenLight',
                  type: 'text',
                  defaultValue: '#95d5b2',
                },
                {
                  name: 'blue',
                  type: 'text',
                  defaultValue: '#4ea8de',
                },
                {
                  name: 'blueDark',
                  type: 'text',
                  defaultValue: '#1d3557',
                },
                {
                  name: 'background',
                  type: 'text',
                  defaultValue: '#f6fbf8',
                },
                {
                  name: 'card',
                  type: 'text',
                  defaultValue: '#ffffff',
                },
                {
                  name: 'text',
                  type: 'text',
                  defaultValue: '#102418',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

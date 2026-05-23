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
          label: 'LL-HLS fallback',
          fields: [
            {
              name: 'hlsPublicBaseUrl',
              type: 'text',
              admin: {
                description: 'Public base URL for generated LL-HLS manifests, e.g. https://app.example.com/hls',
              },
            },
            {
              name: 'hlsMode',
              type: 'select',
              defaultValue: 'low-latency',
              options: [{ label: 'Low-latency HLS (LL-HLS)', value: 'low-latency' }],
              admin: {
                readOnly: true,
                description: 'Live events always use LL-HLS. Compatibility playback stays within 1 second of live.',
              },
            },
            {
              name: 'hlsSegmentDuration',
              type: 'number',
              defaultValue: 1,
              min: 1,
              max: 1,
              admin: {
                description: 'Segment duration in seconds. Fixed at 1 second for sub-second live delay targets.',
              },
            },
          ],
        },
        {
          label: 'Mobile app',
          fields: [
            {
              name: 'mobileAppEnabled',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Show the Android listener app download in the site footer with QR code.',
              },
            },
            {
              name: 'mobileAppGithubRepo',
              type: 'text',
              defaultValue: 'silvansan/ablaut-App',
              admin: {
                description: 'GitHub owner/repo used when syncing the latest release.',
              },
            },
            {
              name: 'mobileAppLatestVersion',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Synced semver version, e.g. 0.3.1',
              },
            },
            {
              name: 'mobileAppLatestTag',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Synced Git tag, e.g. v0.3.1',
              },
            },
            {
              name: 'mobileAppDownloadUrl',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Direct APK asset URL from GitHub Releases.',
              },
            },
            {
              name: 'mobileAppReleaseNotes',
              type: 'textarea',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'mobileAppPublishedAt',
              type: 'date',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'mobileAppLastSyncedAt',
              type: 'date',
              admin: {
                readOnly: true,
              },
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

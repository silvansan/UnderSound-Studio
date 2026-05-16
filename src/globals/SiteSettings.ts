import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'UnderSound',
    },
    {
      name: 'publicBaseUrl',
      type: 'text',
    },
    {
      name: 'supportEmail',
      type: 'email',
    },
    {
      name: 'allowPublicListenerPages',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'livekitPublicUrl',
      type: 'text',
    },
  ],
}

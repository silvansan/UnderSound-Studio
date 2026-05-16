'use server'

import { revalidatePath } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { importUnderSoundConfig } from '@/lib/config-transfer'
import { isSuperAdminUser } from '@/lib/permissions'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberValue(formData: FormData, key: string): number | undefined {
  const value = stringValue(formData, key)
  const parsed = value ? Number(value) : undefined

  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined
}

function checkedValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

export async function updateSiteSettingsAction(formData: FormData) {
  const user = await requireAppUser()

  if (!isSuperAdminUser(user)) {
    throw new Error('Only super admins can update site settings.')
  }

  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      allowPublicListenerPages: checkedValue(formData, 'allowPublicListenerPages'),
      defaultQrStyle: stringValue(formData, 'defaultQrStyle') === 'high-contrast' ? 'high-contrast' : 'undersound-default',
      defaultTokenExpiry: numberValue(formData, 'defaultTokenExpiry') ?? 3600,
      livekitPublicUrl: stringValue(formData, 'livekitPublicUrl'),
      publicBaseUrl: stringValue(formData, 'publicBaseUrl'),
      requireEmailVerification: checkedValue(formData, 'requireEmailVerification'),
      siteName: stringValue(formData, 'siteName') ?? 'UnderSound',
      supportEmail: stringValue(formData, 'supportEmail'),
    },
    overrideAccess: true,
  })

  revalidatePath('/settings')
}

export async function importConfigAction(formData: FormData) {
  const user = await requireAppUser()
  const scope = stringValue(formData, 'scope')
  const file = formData.get('configFile')

  if (!(file instanceof File)) {
    throw new Error('Choose a config JSON file to import.')
  }

  const json = JSON.parse(await file.text()) as unknown

  await importUnderSoundConfig(user, json, scope)

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath('/channels')
  revalidatePath('/settings')
}

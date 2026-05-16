'use server'

import { revalidatePath } from 'next/cache'

import { requireAppUser } from '@/lib/app-auth'
import { importUnderSoundConfig } from '@/lib/config-transfer'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
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

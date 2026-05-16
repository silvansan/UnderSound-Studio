'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

function statusValue(formData: FormData): 'active' | 'archived' | 'draft' {
  const value = stringValue(formData, 'status')

  return value === 'active' || value === 'archived' ? value : 'draft'
}

function dateValue(formData: FormData, key: string): string | undefined {
  const value = stringValue(formData, key)

  return value ? new Date(value).toISOString() : undefined
}

export async function createEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const title = stringValue(formData, 'title')

  if (!title) {
    throw new Error('Event title is required.')
  }

  const event = await payload.create({
    collection: 'events',
    data: {
      dateEnd: dateValue(formData, 'dateEnd'),
      dateStart: dateValue(formData, 'dateStart'),
      defaultLanguage: stringValue(formData, 'defaultLanguage') ?? 'en',
      description: stringValue(formData, 'description'),
      location: stringValue(formData, 'location'),
      publicListenerEnabled: booleanValue(formData, 'publicListenerEnabled'),
      slug: slugify(stringValue(formData, 'slug') ?? title),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      status: statusValue(formData),
      title,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  redirect(`/events/${event.slug}`)
}

export async function updateEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const id = stringValue(formData, 'id')
  const originalSlug = stringValue(formData, 'originalSlug')
  const title = stringValue(formData, 'title')

  if (!id || !originalSlug || !title) {
    throw new Error('Event ID, original slug, and title are required.')
  }

  const event = await payload.update({
    id,
    collection: 'events',
    data: {
      dateEnd: dateValue(formData, 'dateEnd'),
      dateStart: dateValue(formData, 'dateStart'),
      defaultLanguage: stringValue(formData, 'defaultLanguage') ?? 'en',
      description: stringValue(formData, 'description'),
      location: stringValue(formData, 'location'),
      publicListenerEnabled: booleanValue(formData, 'publicListenerEnabled'),
      slug: slugify(stringValue(formData, 'slug') ?? title),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      status: statusValue(formData),
      title,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath(`/events/${originalSlug}`)
  redirect(`/events/${event.slug}`)
}

export async function deleteEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const id = stringValue(formData, 'id')

  if (!id) {
    throw new Error('Event ID is required.')
  }

  await payload.delete({
    id,
    collection: 'events',
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  redirect('/events')
}

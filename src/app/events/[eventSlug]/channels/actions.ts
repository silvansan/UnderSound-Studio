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

function tokenModeValue(formData: FormData): 'password' | 'private' | 'public' {
  const value = stringValue(formData, 'listenerTokenMode')

  return value === 'password' || value === 'private' ? value : 'public'
}

async function getEventID(eventSlug: string) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      slug: {
        equals: eventSlug,
      },
    },
  })

  return { eventID: events.docs[0]?.id, payload, user }
}

export async function createChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const name = stringValue(formData, 'name')

  if (!eventSlug || !name) {
    throw new Error('Event slug and channel name are required.')
  }

  const { eventID, payload, user } = await getEventID(eventSlug)

  if (!eventID) {
    throw new Error('Event not found.')
  }

  const channel = await payload.create({
    collection: 'channels',
    data: {
      description: stringValue(formData, 'description'),
      enabled: booleanValue(formData, 'enabled'),
      event: eventID,
      hlsEnabled: booleanValue(formData, 'hlsEnabled'),
      icecastFallbackUrl: stringValue(formData, 'icecastFallbackUrl'),
      languageCode: stringValue(formData, 'languageCode'),
      languageLabel: stringValue(formData, 'languageLabel'),
      listenerPageEnabled: booleanValue(formData, 'listenerPageEnabled'),
      listenerTokenMode: tokenModeValue(formData),
      slug: slugify(stringValue(formData, 'slug') ?? name),
      speakerPageEnabled: booleanValue(formData, 'speakerPageEnabled'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      sortOrder: Number(stringValue(formData, 'sortOrder') ?? 0),
      webrtcEnabled: booleanValue(formData, 'webrtcEnabled'),
      name,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)
  redirect(`/events/${eventSlug}/channels/${channel.slug}`)
}

export async function updateChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const id = stringValue(formData, 'id')
  const originalSlug = stringValue(formData, 'originalSlug')
  const name = stringValue(formData, 'name')

  if (!eventSlug || !id || !originalSlug || !name) {
    throw new Error('Event slug, channel ID, original slug, and name are required.')
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const channel = await payload.update({
    id,
    collection: 'channels',
    data: {
      description: stringValue(formData, 'description'),
      enabled: booleanValue(formData, 'enabled'),
      hlsEnabled: booleanValue(formData, 'hlsEnabled'),
      icecastFallbackUrl: stringValue(formData, 'icecastFallbackUrl'),
      languageCode: stringValue(formData, 'languageCode'),
      languageLabel: stringValue(formData, 'languageLabel'),
      listenerPageEnabled: booleanValue(formData, 'listenerPageEnabled'),
      listenerTokenMode: tokenModeValue(formData),
      slug: slugify(stringValue(formData, 'slug') ?? name),
      speakerPageEnabled: booleanValue(formData, 'speakerPageEnabled'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      sortOrder: Number(stringValue(formData, 'sortOrder') ?? 0),
      webrtcEnabled: booleanValue(formData, 'webrtcEnabled'),
      name,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)
  revalidatePath(`/events/${eventSlug}/channels/${originalSlug}`)
  redirect(`/events/${eventSlug}/channels/${channel.slug}`)
}

export async function deleteChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const id = stringValue(formData, 'id')

  if (!eventSlug || !id) {
    throw new Error('Event slug and channel ID are required.')
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  await payload.delete({
    id,
    collection: 'channels',
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)
  redirect(`/events/${eventSlug}/channels`)
}

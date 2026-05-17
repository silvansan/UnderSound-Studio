'use server'

import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import {
  generateInvitedUserActivationEmailHTML,
  generateInvitedUserActivationEmailSubject,
  getBaseUrl,
  joinUrl,
} from '@/lib/email'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function roleValue(formData: FormData, canSetAdmin: boolean): 'admin' | 'moderator' {
  return canSetAdmin && stringValue(formData, 'role') === 'admin' ? 'admin' : 'moderator'
}

function updateRoleValue(formData: FormData): 'admin' | 'moderator' | 'super_admin' {
  const role = stringValue(formData, 'role')

  if (role === 'super_admin' || role === 'admin') {
    return role
  }

  return 'moderator'
}

export async function inviteUserAction(formData: FormData) {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    throw new Error('Only admins can invite users.')
  }

  const payload = await getPayload({ config: configPromise })
  const email = stringValue(formData, 'email')?.toLowerCase()
  const name = stringValue(formData, 'name')

  if (!email || !name) {
    throw new Error('Name and email are required.')
  }

  const temporaryPassword = randomBytes(32).toString('base64url')
  const canSetAdmin = isSuperAdminUser(currentUser)
  const data = {
    email,
    invitationStatus: 'pending' as const,
    invitedAt: new Date().toISOString(),
    invitedBy: currentUser.id,
    name,
    password: temporaryPassword,
    role: canSetAdmin ? roleValue(formData, true) : 'moderator' as const,
  }

  await payload.create({
    collection: 'users',
    data,
    disableVerificationEmail: false,
    overrideAccess: false,
    user: currentUser,
  })

  const resetToken = await payload.forgotPassword({
    collection: 'users',
    data: { email },
    disableEmail: true,
    overrideAccess: true,
  })

  await payload.sendEmail({
    html: generateInvitedUserActivationEmailHTML({
      activationUrl: joinUrl(getBaseUrl(), `/reset-password/${resetToken ?? ''}`),
      email,
    }),
    subject: generateInvitedUserActivationEmailSubject(),
    to: email,
  })

  revalidatePath('/users')
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    throw new Error('Only admins can update users.')
  }

  const id = stringValue(formData, 'id')
  const name = stringValue(formData, 'name')
  const preferredLanguage = stringValue(formData, 'preferredLanguage') ?? 'en'

  if (!id || !name) {
    throw new Error('User ID and name are required.')
  }

  const payload = await getPayload({ config: configPromise })
  const data = isSuperAdminUser(currentUser)
    ? {
        active: formData.get('active') === 'on',
        name,
        preferredLanguage,
        role: updateRoleValue(formData),
      }
    : {
        name,
        preferredLanguage,
      }

  await payload.update({
    id,
    collection: 'users',
    data,
    overrideAccess: false,
    user: currentUser,
  })

  revalidatePath('/users')
}

export async function deleteUserAction(formData: FormData) {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    throw new Error('Only admins can delete users.')
  }

  const id = stringValue(formData, 'id')

  if (!id || String(currentUser.id) === id) {
    throw new Error('A valid user other than yourself is required.')
  }

  const payload = await getPayload({ config: configPromise })
  const targetUser = await payload.findByID({
    id,
    collection: 'users',
    overrideAccess: true,
    user: currentUser,
  })

  if (!isSuperAdminUser(currentUser) && targetUser.role !== 'moderator') {
    throw new Error('Admins can only delete moderator accounts.')
  }

  const assignments = await payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    user: currentUser,
    where: {
      user: {
        equals: id,
      },
    },
  })

  for (const assignment of assignments.docs) {
    await payload.delete({
      id: assignment.id,
      collection: 'event-assignments',
      overrideAccess: true,
      user: currentUser,
    })
  }

  await payload.delete({
    id,
    collection: 'users',
    overrideAccess: true,
    user: currentUser,
  })

  revalidatePath('/users')
}

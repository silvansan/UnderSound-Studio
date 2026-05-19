import type { Payload } from 'payload'

import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
  generateInvitedUserActivationEmailHTML,
  generateInvitedUserActivationEmailSubject,
  getBaseUrl,
  joinUrl,
} from '@/lib/email'

export async function sendUserPasswordResetEmail(payload: Payload, email: string) {
  const resetToken = await payload.forgotPassword({
    collection: 'users',
    data: { email },
    disableEmail: true,
    overrideAccess: true,
  })

  if (!resetToken) {
    throw new Error('Could not create a password reset token for this user.')
  }

  const resetUrl = joinUrl(getBaseUrl(), `/reset-password/${resetToken}`)

  await payload.sendEmail({
    html: generateForgotPasswordEmailHTML({
      token: resetToken,
      user: { email } as never,
    }),
    subject: generateForgotPasswordEmailSubject(),
    to: email,
  })

  return resetUrl
}

export async function sendUserActivationInviteEmail(payload: Payload, email: string) {
  const resetToken = await payload.forgotPassword({
    collection: 'users',
    data: { email },
    disableEmail: true,
    overrideAccess: true,
  })

  if (!resetToken) {
    throw new Error('Could not create an activation token for this user.')
  }

  const activationUrl = joinUrl(getBaseUrl(), `/reset-password/${resetToken}`)

  await payload.sendEmail({
    html: generateInvitedUserActivationEmailHTML({
      activationUrl,
      email,
    }),
    subject: generateInvitedUserActivationEmailSubject(),
    to: email,
  })

  return activationUrl
}

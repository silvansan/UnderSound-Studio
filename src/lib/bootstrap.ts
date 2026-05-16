import type { Payload } from 'payload'

export async function ensureInitialSuperAdmin(payload: Payload) {
  const existingUsers = await payload.count({
    collection: 'users',
    overrideAccess: true,
  })

  if (existingUsers.totalDocs > 0) {
    return
  }

  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim()
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD?.trim()

  if (!email || !password) {
    payload.logger.warn(
      'No users exist, but INITIAL_SUPER_ADMIN_EMAIL or INITIAL_SUPER_ADMIN_PASSWORD is missing. Skipping bootstrap user creation.',
    )
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      _verified: true,
      active: true,
      email,
      name: 'Initial Super Admin',
      password,
      role: 'super_admin',
    },
    disableVerificationEmail: true,
    overrideAccess: true,
  })

  payload.logger.info(`Created initial super admin account for ${email}.`)
}

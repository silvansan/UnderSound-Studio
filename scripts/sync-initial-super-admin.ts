import { getPayload } from 'payload'

process.env.PAYLOAD_MIGRATING = 'true'

const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD?.trim()

if (!email || !password) {
  throw new Error('INITIAL_SUPER_ADMIN_EMAIL and INITIAL_SUPER_ADMIN_PASSWORD must be set.')
}

const { default: configPromise } = await import('@payload-config')
const payload = await getPayload({ config: configPromise })

try {
  const existingConfiguredUser = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const fallbackSuperAdmin = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: 'createdAt',
    where: {
      role: {
        equals: 'super_admin',
      },
    },
  })

  const userToUpdate = existingConfiguredUser.docs[0] ?? fallbackSuperAdmin.docs[0]

  if (!userToUpdate) {
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
    console.log('Created initial super admin from environment.')
  } else {
    await payload.update({
      id: userToUpdate.id,
      collection: 'users',
      data: {
        _verified: true,
        active: true,
        email,
        password,
        role: 'super_admin',
      },
      overrideAccess: true,
    })
    console.log('Synced existing super admin to environment credentials.')
  }
} finally {
  await payload.destroy()
}

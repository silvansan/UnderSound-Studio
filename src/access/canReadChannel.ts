import type { Access } from 'payload'

import { getViewableEventIDs, isModeratorUser, isSuperAdminUser } from '@/lib/permissions'

export const canReadChannel: Access = async ({ req }) => {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isModeratorUser(req.user)) {
    return false
  }

  const eventIDs = await getViewableEventIDs(req)

  if (eventIDs === null) {
    return true
  }

  if (eventIDs.length === 0) {
    return false
  }

  return {
    event: {
      in: eventIDs,
    },
  }
}

import type { Access } from 'payload'

import { getChannelManageableEventIDs, isModeratorUser, isSuperAdminUser } from '@/lib/permissions'

export const canManageChannel: Access = async ({ req }) => {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isModeratorUser(req.user)) {
    return false
  }

  const eventIDs = await getChannelManageableEventIDs(req)

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

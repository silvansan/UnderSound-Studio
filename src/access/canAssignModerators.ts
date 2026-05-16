import type { Access } from 'payload'

import { canUserManageEventByID, isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const canAssignModerators: Access = async ({ data, req }) => {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isAdminUser(req.user)) {
    return false
  }

  return canUserManageEventByID(req, data?.event)
}

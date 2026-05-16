import type { Access } from 'payload'

import { canUserManageChannelsForEventByID } from '@/lib/permissions'

export const canCreateChannel: Access = async ({ data, req }) => {
  return canUserManageChannelsForEventByID(req, data?.event)
}

import type { Access } from 'payload'

import { getManageableEventWhere } from '@/lib/permissions'

export const canManageEvent: Access = async ({ req }) => {
  return getManageableEventWhere(req)
}

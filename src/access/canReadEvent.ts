import type { Access } from 'payload'

import { getReadableEventWhere } from '@/lib/permissions'

export const canReadEvent: Access = async ({ req }) => {
  return getReadableEventWhere(req)
}

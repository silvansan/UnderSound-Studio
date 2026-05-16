import type { Access } from 'payload'

export const isSuperAdmin: Access = ({ req: { user } }) => {
  return user?.role === 'super_admin'
}

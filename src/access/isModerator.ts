import type { Access } from 'payload'

export const isModerator: Access = ({ req: { user } }) => {
  return (
    user?.role === 'moderator' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin'
  )
}

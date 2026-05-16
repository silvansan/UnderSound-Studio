export type UserRole = 'super_admin' | 'admin' | 'moderator'

export type AppUser = {
  role?: string | null
}

export function hasRole(user: AppUser | null | undefined, roles: UserRole[]): boolean {
  if (!user?.role) return false
  return roles.includes(user.role as UserRole)
}

export function isSuperAdminUser(user: AppUser | null | undefined): boolean {
  return user?.role === 'super_admin'
}

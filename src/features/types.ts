export type FeatureNavItem = {
  children?: Array<{ href: string; label: string }>
  featureId: string
  href: string
  label: string
}

export type AblautFeature = {
  enabled: () => boolean
  id: string
  label: string
  navItems?: (context: FeatureNavContext) => FeatureNavItem[]
}

export type FeatureNavContext = {
  isAdmin: boolean
  isSuperAdmin: boolean
  showMultiOrganizationNav: boolean
}

export function isFeatureEnabled(featureId: string): boolean {
  const envKey = `FEATURE_${featureId.toUpperCase().replace(/-/g, '_')}`
  const envValue = process.env[envKey]

  if (envValue === 'false') {
    return false
  }

  return true
}

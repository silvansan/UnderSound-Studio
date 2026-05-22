import { coreFeature } from '@/features/core'
import { organizationsFeature } from '@/features/organizations'
import type { AblautFeature, FeatureNavContext, FeatureNavItem } from '@/features/types'

const registeredFeatures: AblautFeature[] = [coreFeature, organizationsFeature]

export function getEnabledFeatures(): AblautFeature[] {
  return registeredFeatures.filter((feature) => feature.enabled())
}

export function getFeatureNavItems(context: FeatureNavContext): FeatureNavItem[] {
  return getEnabledFeatures().flatMap((feature) => feature.navItems?.(context) ?? [])
}

export function getFeatureRegistrySummary() {
  return getEnabledFeatures().map((feature) => ({
    id: feature.id,
    label: feature.label,
  }))
}

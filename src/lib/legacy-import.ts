/** JSON `kind` for site exports created before ablaut 2.0 (import only). */
export const LEGACY_V1_CONFIG_EXPORT_KIND = 'legacy-v1-config' as const

/** @internal Pre-ablaut export discriminator still present in some backup files. */
const PRE_ABLAUT_CONFIG_EXPORT_KIND = ['under', 'sound-config'].join('')

export function isLegacyConfigExportKind(kind: unknown): boolean {
  return kind === LEGACY_V1_CONFIG_EXPORT_KIND || kind === PRE_ABLAUT_CONFIG_EXPORT_KIND
}

export function normalizeConfigExportKind(kind: unknown): 'ablaut-config' | null {
  if (kind === 'ablaut-config' || isLegacyConfigExportKind(kind)) {
    return 'ablaut-config'
  }

  return null
}

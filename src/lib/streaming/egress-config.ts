export function isHlsEgressEnabled(): boolean {
  if (process.env.FEATURE_HLS_EGRESS === 'false' || process.env.LIVEKIT_EGRESS_ENABLED === 'false') {
    return false
  }

  return true
}

/** Absolute path inside the livekit-egress container where HLS segments are written. */
export function getHlsEgressOutputDirectory(): string {
  const configured = process.env.HLS_EGRESS_OUTPUT_DIR?.trim()

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  return '/out'
}

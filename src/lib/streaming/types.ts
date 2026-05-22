export type TransportKind = 'webrtc' | 'hls'

export type HlsEgressStatus = 'error' | 'idle' | 'live' | 'starting'

export type TransportStatus = 'hls_available' | 'hls_live' | 'idle' | 'webrtc_available'

export type ChannelStreamInfo = {
  fallbackUrl?: string | null
  hlsAvailable: boolean
  hlsEgressStatus?: HlsEgressStatus | null
  hlsMode?: 'low-latency' | 'standard' | null
  hlsUrl?: string | null
  recommendedTransport: TransportKind
  transportStatus: TransportStatus
  webrtcAvailable: boolean
}

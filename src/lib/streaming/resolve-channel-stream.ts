import {
  buildHlsManifestUrl,
  resolveChannelHlsUrl,
  resolveHlsPlaylistName,
  resolveHlsPublicBaseUrl,
} from '@/lib/streaming/build-hls-url'
import type { ChannelStreamInfo, HlsEgressStatus, TransportKind, TransportStatus } from '@/lib/streaming/types'
import type { Channel, Event, SiteSetting } from '@/payload-types'

type ResolveChannelStreamInput = {
  channel: Pick<
    Channel,
    'hlsEnabled' | 'hlsEgressStatus' | 'hlsPlaybackUrl' | 'icecastFallbackUrl' | 'slug' | 'webrtcEnabled'
  >
  event: Pick<Event, 'slug'>
  preferSafariCompatibility?: boolean
  requestBaseUrl?: string | null
  settings?: SiteSetting | null
}

function normalizeEgressStatus(value?: string | null): HlsEgressStatus | null {
  if (value === 'idle' || value === 'starting' || value === 'live' || value === 'error') {
    return value
  }

  return null
}

function resolveTransportStatus(
  webrtcAvailable: boolean,
  hlsAvailable: boolean,
  hlsEgressStatus?: HlsEgressStatus | null,
): TransportStatus {
  if (hlsEgressStatus === 'live') {
    return 'hls_live'
  }

  if (hlsAvailable) {
    return 'hls_available'
  }

  if (webrtcAvailable) {
    return 'webrtc_available'
  }

  return 'idle'
}

function resolveRecommendedTransport(
  webrtcAvailable: boolean,
  hlsAvailable: boolean,
  preferSafariCompatibility: boolean,
): TransportKind {
  if (preferSafariCompatibility && hlsAvailable) {
    return 'hls'
  }

  if (webrtcAvailable) {
    return 'webrtc'
  }

  if (hlsAvailable) {
    return 'hls'
  }

  return 'webrtc'
}

export function resolveChannelStreamInfo({
  channel,
  event,
  preferSafariCompatibility = false,
  requestBaseUrl,
  settings,
}: ResolveChannelStreamInput): ChannelStreamInfo {
  const webrtcAvailable = channel.webrtcEnabled !== false
  const hlsUrl = resolveChannelHlsUrl(channel, event, settings, requestBaseUrl)
  const hlsAvailable = Boolean(hlsUrl)
  const hlsEgressStatus = normalizeEgressStatus(channel.hlsEgressStatus)
  const fallbackUrl = channel.icecastFallbackUrl?.trim() || null
  const hlsMode = 'low-latency'

  return {
    fallbackUrl,
    hlsAvailable,
    hlsEgressStatus,
    hlsMode,
    hlsUrl,
    recommendedTransport: resolveRecommendedTransport(webrtcAvailable, hlsAvailable, preferSafariCompatibility),
    transportStatus: resolveTransportStatus(webrtcAvailable, hlsAvailable, hlsEgressStatus),
    webrtcAvailable,
  }
}

export function syncChannelHlsPlaybackUrl(
  channel: Pick<Channel, 'hlsEnabled' | 'hlsPlaybackUrl' | 'slug'>,
  event: Pick<Event, 'slug'>,
  settings?: SiteSetting | null,
): string | null {
  if (channel.hlsEnabled !== true) {
    return null
  }

  return buildHlsManifestUrl(
    event.slug,
    channel.slug,
    resolveHlsPublicBaseUrl(settings),
    resolveHlsPlaylistName(settings),
  )
}

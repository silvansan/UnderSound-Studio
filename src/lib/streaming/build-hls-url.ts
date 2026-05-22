import type { Channel, Event, SiteSetting } from '@/payload-types'

import {
  clampLiveSegmentDuration,
  DEFAULT_LIVE_SEGMENT_DURATION_SECONDS,
  LIVE_HLS_PLAYLIST_NAME,
} from '@/lib/streaming/ll-hls-config'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function resolveHlsMode(_settings?: SiteSetting | null): 'low-latency' {
  return 'low-latency'
}

export function resolveHlsPlaylistName(_settings?: SiteSetting | null): string {
  return LIVE_HLS_PLAYLIST_NAME
}

export function resolveHlsSegmentDuration(settings?: SiteSetting | null): number {
  return clampLiveSegmentDuration(settings?.hlsSegmentDuration ?? DEFAULT_LIVE_SEGMENT_DURATION_SECONDS)
}
export function buildHlsManifestPath(
  eventSlug: string,
  channelSlug: string,
  playlistName = 'index.m3u8',
): string {
  return `${eventSlug}/${channelSlug}/${playlistName}`
}

export function buildHlsManifestUrl(
  eventSlug: string,
  channelSlug: string,
  baseUrl?: string | null,
  playlistName = 'index.m3u8',
): string | null {
  const normalizedBase = baseUrl?.trim()

  if (!normalizedBase) {
    return null
  }

  return `${trimTrailingSlash(normalizedBase)}/${buildHlsManifestPath(eventSlug, channelSlug, playlistName)}`
}

export function appendHlsCacheBuster(manifestUrl: string, sessionKey: string | number): string {
  const separator = manifestUrl.includes('?') ? '&' : '?'

  return `${manifestUrl}${separator}v=${encodeURIComponent(String(sessionKey))}`
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function rewriteLocalhostBaseUrl(baseUrl: string, requestBaseUrl?: string | null): string {
  const requestBase = requestBaseUrl?.trim()

  if (!requestBase) {
    return baseUrl
  }

  try {
    const configured = new URL(baseUrl)
    const request = new URL(requestBase)

    if (!isLocalHost(configured.hostname) || isLocalHost(request.hostname)) {
      return baseUrl
    }

    configured.hostname = request.hostname
    configured.protocol = request.protocol
    configured.port = request.port

    return trimTrailingSlash(configured.toString())
  } catch {
    return baseUrl
  }
}

export function resolveHlsPublicBaseUrl(
  settings?: SiteSetting | null,
  requestBaseUrl?: string | null,
): string | null {
  const fromSettings = settings?.hlsPublicBaseUrl?.trim()
  const fromEnv = process.env.HLS_PUBLIC_BASE_URL?.trim()
  const appBase = settings?.publicBaseUrl?.trim() || process.env.PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (fromSettings) {
    return rewriteLocalhostBaseUrl(trimTrailingSlash(fromSettings), requestBaseUrl)
  }

  if (fromEnv) {
    return rewriteLocalhostBaseUrl(trimTrailingSlash(fromEnv), requestBaseUrl)
  }

  if (requestBaseUrl?.trim()) {
    return `${trimTrailingSlash(requestBaseUrl)}/hls`
  }

  if (appBase) {
    return `${trimTrailingSlash(appBase)}/hls`
  }

  return null
}

export function resolveChannelHlsUrl(
  channel: Pick<Channel, 'hlsEnabled' | 'hlsEgressStatus' | 'hlsPlaybackUrl' | 'slug'>,
  event: Pick<Event, 'slug'>,
  settings?: SiteSetting | null,
  requestBaseUrl?: string | null,
): string | null {
  if (channel.hlsEnabled !== true) {
    return null
  }

  const egressStatus = channel.hlsEgressStatus

  if (egressStatus !== 'live') {
    return null
  }

  const playlistName = resolveHlsPlaylistName(settings)

  return buildHlsManifestUrl(
    event.slug,
    channel.slug,
    resolveHlsPublicBaseUrl(settings, requestBaseUrl),
    playlistName,
  )
}

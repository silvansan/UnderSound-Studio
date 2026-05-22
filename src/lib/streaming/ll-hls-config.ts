/** Target sync distance from the live edge in hls.js (best effort). */
export const MAX_LIVE_LATENCY_SECONDS = 1

/** How far behind live hls.js tries to stay during steady playback. */
export const LIVE_SYNC_DURATION_SECONDS = 3

/** Allow this much drift before hls.js jumps forward (avoids audible drop/recover loops). */
export const LIVE_MAX_LATENCY_SECONDS = 8

/** Rolling playlist window — keeps enough segments to avoid stalls between refreshes. */
export const LIVE_PLAYLIST_WINDOW_SECONDS = 12

/** Honest listener-facing latency copy for LL-HLS compatibility mode. */
export const HLS_COMPAT_LATENCY_LABEL = 'typically ~2–4s behind live'

export const DEFAULT_LIVE_SEGMENT_DURATION_SECONDS = 1

export const LIVE_HLS_PLAYLIST_NAME = 'index.live.m3u8'

export function resolveMaxLiveSegments(segmentDurationSeconds: number): number {
  const segmentDuration = Math.max(1, segmentDurationSeconds)

  return Math.max(2, Math.ceil(LIVE_PLAYLIST_WINDOW_SECONDS / segmentDuration))
}

export function clampLiveSegmentDuration(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_LIVE_SEGMENT_DURATION_SECONDS
  }

  return Math.max(1, Math.min(MAX_LIVE_LATENCY_SECONDS, Math.round(value)))
}

export function toLiveHlsManifestUrl(manifestUrl: string): string {
  if (manifestUrl.includes(LIVE_HLS_PLAYLIST_NAME)) {
    return manifestUrl
  }

  if (manifestUrl.includes('index.m3u8')) {
    return manifestUrl.replace('index.m3u8', LIVE_HLS_PLAYLIST_NAME)
  }

  return manifestUrl
}

export type HlsJsLiveConfig = {
  backBufferLength: number
  enableWorker: boolean
  fragLoadingMaxRetry: number
  fragLoadingRetryDelay: number
  initialLiveManifestSize: number
  liveBackBufferLength: number
  liveMaxLatencyDuration: number
  liveMaxLatencyDurationCount: number
  liveSyncDuration: number
  liveSyncDurationCount: number
  lowLatencyMode: boolean
  maxBufferHole: number
  maxBufferLength: number
  maxLiveSyncPlaybackRate: number
  maxMaxBufferLength: number
  startPosition: number
}

export function createHlsJsLiveConfig(segmentDurationSeconds = DEFAULT_LIVE_SEGMENT_DURATION_SECONDS): HlsJsLiveConfig {
  const segmentDuration = clampLiveSegmentDuration(segmentDurationSeconds)
  const playlistSegments = resolveMaxLiveSegments(segmentDuration)

  return {
    backBufferLength: 0,
    enableWorker: true,
    fragLoadingMaxRetry: 2,
    fragLoadingRetryDelay: 400,
    initialLiveManifestSize: Math.min(3, playlistSegments),
    liveBackBufferLength: 0,
    liveMaxLatencyDuration: LIVE_MAX_LATENCY_SECONDS,
    liveMaxLatencyDurationCount: 3,
    liveSyncDuration: LIVE_SYNC_DURATION_SECONDS,
    liveSyncDurationCount: 1,
    lowLatencyMode: true,
    maxBufferHole: 0.5,
    maxBufferLength: LIVE_PLAYLIST_WINDOW_SECONDS,
    maxLiveSyncPlaybackRate: 1.25,
    maxMaxBufferLength: LIVE_PLAYLIST_WINDOW_SECONDS + 4,
    startPosition: -1,
  }
}

export function sequenceFromSegmentUri(uri: string): number | null {
  const match = uri.match(/index_(\d+)\.ts$/)

  return match ? Number.parseInt(match[1] ?? '', 10) : null
}

function upsertMediaSequence(preamble: string[], sequence: number): string[] {
  let found = false

  const updated = preamble.map((line) => {
    if (!line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      return line
    }

    found = true

    return `#EXT-X-MEDIA-SEQUENCE:${sequence}`
  })

  if (found) {
    return updated
  }

  const targetDurationIndex = updated.findIndex((line) => line.startsWith('#EXT-X-TARGETDURATION:'))

  if (targetDurationIndex >= 0) {
    updated.splice(targetDurationIndex + 1, 0, `#EXT-X-MEDIA-SEQUENCE:${sequence}`)

    return updated
  }

  return [...updated, `#EXT-X-MEDIA-SEQUENCE:${sequence}`]
}

export function trimLiveHlsPlaylist(
  manifest: string,
  maxLatencySeconds = LIVE_PLAYLIST_WINDOW_SECONDS,
): string {
  const lines = manifest.split(/\r?\n/)
  let targetDuration = DEFAULT_LIVE_SEGMENT_DURATION_SECONDS
  const preamble: string[] = []
  const segmentBlocks: string[][] = []
  const tail: string[] = []
  let index = 0

  while (index < lines.length && !lines[index]?.startsWith('#EXTINF:')) {
    const line = lines[index] ?? ''

    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = clampLiveSegmentDuration(Number.parseFloat(line.slice('#EXT-X-TARGETDURATION:'.length)))
    }

    preamble.push(line)
    index += 1
  }

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (line.startsWith('#EXTINF:')) {
      const block = [line]
      index += 1

      while (index < lines.length) {
        const nextLine = lines[index] ?? ''

        if (nextLine.startsWith('#EXTINF:') || nextLine.startsWith('#EXT-X-ENDLIST')) {
          break
        }

        block.push(nextLine)
        index += 1

        if (!nextLine.startsWith('#')) {
          break
        }
      }

      segmentBlocks.push(block)
      continue
    }

    if (segmentBlocks.length > 0) {
      tail.push(line)
    } else {
      preamble.push(line)
    }

    index += 1
  }

  const maxSegments = Math.max(1, Math.ceil(maxLatencySeconds / targetDuration))

  if (segmentBlocks.length <= maxSegments) {
    return manifest
  }

  const trimmedTail = tail.filter((line) => line.trim().length > 0 && !line.startsWith('#EXT-X-ENDLIST'))
  const keptSegments = segmentBlocks.slice(-maxSegments)
  const firstSegmentUri = keptSegments
    .flat()
    .find((line) => line.trim().length > 0 && !line.startsWith('#'))
  const mediaSequence = firstSegmentUri ? sequenceFromSegmentUri(firstSegmentUri) : null
  const trimmedPreamble = mediaSequence === null ? preamble : upsertMediaSequence(preamble, mediaSequence)

  return [...trimmedPreamble, ...keptSegments.flat(), ...trimmedTail].join('\n')
}

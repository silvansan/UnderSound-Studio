import { access, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

import { buildHlsManifestPath, resolveHlsPlaylistName } from '@/lib/streaming/build-hls-url'
import { LIVE_HLS_PLAYLIST_NAME, sequenceFromSegmentUri, trimLiveHlsPlaylist } from '@/lib/streaming/ll-hls-config'
import { getHlsSegmentsDirectory } from '@/lib/stream-health'
import type { SiteSetting } from '@/payload-types'

export function getHlsManifestDiskPath(
  eventSlug: string,
  channelSlug: string,
  playlistName = LIVE_HLS_PLAYLIST_NAME,
): string {
  return path.join(getHlsSegmentsDirectory(), buildHlsManifestPath(eventSlug, channelSlug, playlistName))
}

export function trimServedLivePlaylist(manifest: string, playlistName: string): string {
  if (!playlistName.endsWith('.m3u8')) {
    return manifest
  }

  return trimLiveHlsPlaylist(manifest)
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

function segmentUriFromBlock(block: string[]): string | null {
  const uri = block.find((line) => line.trim().length > 0 && !line.startsWith('#'))?.trim()

  return uri ?? null
}

async function segmentFileExists(channelDirectory: string, segmentUri: string): Promise<boolean> {
  try {
    await access(path.join(channelDirectory, path.basename(segmentUri)))

    return true
  } catch {
    return false
  }
}

/** Drop playlist entries whose `.ts` files are missing (prevents stale segment 404 loops). */
export async function filterManifestToExistingSegments(
  manifest: string,
  channelDirectory: string,
): Promise<string> {
  const lines = manifest.split(/\r?\n/)
  const preamble: string[] = []
  const segmentBlocks: string[][] = []
  const tail: string[] = []
  let index = 0

  while (index < lines.length && !lines[index]?.startsWith('#EXTINF:')) {
    preamble.push(lines[index] ?? '')
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

  const keptBlocks: string[][] = []

  for (const block of segmentBlocks) {
    const segmentUri = segmentUriFromBlock(block)

    if (segmentUri && (await segmentFileExists(channelDirectory, segmentUri))) {
      keptBlocks.push(block)
    }
  }

  if (keptBlocks.length === 0) {
    if (segmentBlocks.length === 0) {
      return manifest
    }

    // #region agent log
    fetch('http://127.0.0.1:7579/ingest/15602ce7-4b12-43d5-85a0-becfc41a86a4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdae02'},body:JSON.stringify({sessionId:'cdae02',location:'hls-manifest-server.ts:filterManifest',message:'all manifest segments missing on disk',data:{segmentCount:segmentBlocks.length,firstUri:segmentUriFromBlock(segmentBlocks[0]??[])},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const filteredTail = tail.filter((line) => line.trim().length > 0 && !line.startsWith('#EXT-X-ENDLIST'))

    return [...preamble, ...filteredTail].join('\n')
  }

  const firstSegmentUri = segmentUriFromBlock(keptBlocks[0] ?? [])
  const mediaSequence = firstSegmentUri ? sequenceFromSegmentUri(firstSegmentUri) : null
  const filteredPreamble = mediaSequence === null ? preamble : upsertMediaSequence(preamble, mediaSequence)
  const filteredTail = tail.filter((line) => line.trim().length > 0 && !line.startsWith('#EXT-X-ENDLIST'))

  return [...filteredPreamble, ...keptBlocks.flat(), ...filteredTail].join('\n')
}

export async function prepareServedHlsManifest(
  manifest: string,
  playlistName: string,
  channelDirectory: string,
): Promise<string> {
  const trimmed = trimServedLivePlaylist(manifest, playlistName)

  return filterManifestToExistingSegments(trimmed, channelDirectory)
}

export function getChannelHlsDirectory(eventSlug: string, channelSlug: string): string {
  return path.join(getHlsSegmentsDirectory(), eventSlug, channelSlug)
}

export async function clearChannelHlsDirectory(eventSlug: string, channelSlug: string): Promise<void> {
  try {
    await rm(getChannelHlsDirectory(eventSlug, channelSlug), { recursive: true, force: true })
  } catch {
    // Directory may not exist yet.
  }
}

export async function readHlsManifestContents(
  eventSlug: string,
  channelSlug: string,
  settings?: SiteSetting | null,
): Promise<string | null> {
  const candidates = [resolveHlsPlaylistName(settings), LIVE_HLS_PLAYLIST_NAME].filter(
    (value, index, array) => array.indexOf(value) === index,
  )

  for (const playlistName of candidates) {
    try {
      return await readFile(getHlsManifestDiskPath(eventSlug, channelSlug, playlistName), 'utf8')
    } catch {
      continue
    }
  }

  return null
}

export function hlsManifestHasSegments(manifest: string): boolean {
  return manifest.includes('#EXTINF:')
}

export async function hlsManifestHasPlayableSegments(
  eventSlug: string,
  channelSlug: string,
  settings?: SiteSetting | null,
): Promise<boolean> {
  const manifest = await readHlsManifestContents(eventSlug, channelSlug, settings)

  return manifest ? hlsManifestHasSegments(manifest) : false
}

export async function hlsManifestExists(  eventSlug: string,
  channelSlug: string,
  settings?: SiteSetting | null,
): Promise<boolean> {
  const candidates = [resolveHlsPlaylistName(settings), LIVE_HLS_PLAYLIST_NAME].filter(
    (value, index, array) => array.indexOf(value) === index,
  )

  for (const playlistName of candidates) {
    try {
      await access(getHlsManifestDiskPath(eventSlug, channelSlug, playlistName))
      return true
    } catch {
      continue
    }
  }

  return false
}

import { LIVE_HLS_PLAYLIST_NAME, toLiveHlsManifestUrl } from '@/lib/streaming/ll-hls-config'

function manifestHasSegments(body: string): boolean {
  return body.includes('#EXTINF:')
}

export function parseSegmentUrisFromManifest(body: string): string[] {
  const lines = body.split(/\r?\n/)
  const uris: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index]?.startsWith('#EXTINF:')) {
      continue
    }

    const uri = lines[index + 1]?.trim()

    if (uri && !uri.startsWith('#')) {
      uris.push(uri)
    }
  }

  return uris
}

/** LL-HLS playback must use the live sliding playlist, not the EVENT master list. */
export function alternateHlsManifestUrls(manifestUrl: string): string[] {
  const liveUrl = toLiveHlsManifestUrl(manifestUrl)

  return liveUrl.includes(LIVE_HLS_PLAYLIST_NAME) ? [liveUrl] : []
}

function resolveSegmentUrl(manifestUrl: string, segmentUri: string): string {
  return new URL(segmentUri, manifestUrl).toString()
}

async function segmentIsAvailable(manifestUrl: string, segmentUri: string): Promise<boolean> {
  try {
    const response = await fetch(resolveSegmentUrl(manifestUrl, segmentUri), {
      cache: 'no-store',
      method: 'GET',
    })

    return response.ok
  } catch {
    return false
  }
}

async function listedSegmentsAreAvailable(manifestUrl: string, body: string): Promise<boolean> {
  const segmentUris = parseSegmentUrisFromManifest(body)

  if (segmentUris.length === 0) {
    return false
  }

  const segmentsToVerify = [...new Set([segmentUris[0], segmentUris[segmentUris.length - 1]])]

  for (const segmentUri of segmentsToVerify) {
    if (!(await segmentIsAvailable(manifestUrl, segmentUri))) {
      return false
    }
  }

  return true
}

async function fetchPlayableManifest(url: string): Promise<string | null> {
  if (!url.includes(LIVE_HLS_PLAYLIST_NAME)) {
    // #region agent log
    fetch('http://127.0.0.1:7579/ingest/15602ce7-4b12-43d5-85a0-becfc41a86a4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdae02'},body:JSON.stringify({sessionId:'cdae02',location:'hls-manifest-client.ts:fetchPlayableManifest',message:'rejected non-live manifest url',data:{url},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return null
  }

  try {
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      return null
    }

    const body = await response.text()

    if (!manifestHasSegments(body)) {
      return null
    }

    const playable = (await listedSegmentsAreAvailable(url, body)) ? url : null

    if (playable) {
      // #region agent log
      fetch('http://127.0.0.1:7579/ingest/15602ce7-4b12-43d5-85a0-becfc41a86a4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdae02'},body:JSON.stringify({sessionId:'cdae02',location:'hls-manifest-client.ts:fetchPlayableManifest',message:'manifest playable',data:{url,segments:parseSegmentUrisFromManifest(body)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }

    return playable
  } catch {
    return null
  }
}

export async function waitForPlayableHlsManifest(
  url: string,
  attempts = 45,
  delayMs = 1000,
): Promise<string | null> {
  const manifestUrls = alternateHlsManifestUrls(url)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    for (const manifestUrl of manifestUrls) {
      const playableUrl = await fetchPlayableManifest(manifestUrl)

      if (playableUrl) {
        return playableUrl
      }
    }

    await new Promise((resolve) => {
      setTimeout(resolve, delayMs)
    })
  }

  return null
}

/** @deprecated Prefer waitForPlayableHlsManifest — empty manifests are not playable. */
export async function waitForHlsManifest(url: string, attempts = 24, delayMs = 1000): Promise<string | null> {
  return waitForPlayableHlsManifest(url, attempts, delayMs)
}

import { access } from 'node:fs/promises'
import path from 'node:path'

import { getLiveKitConfigOrNull } from '@/lib/livekit'
import { isHlsEgressEnabled } from '@/lib/streaming/egress-config'

export type StreamHealthSnapshot = {
  egressConfigured: boolean
  hlsSegmentsPath?: string
  hlsSegmentsWritable?: boolean
  livekitConfigured: boolean
  livekitUrl?: string
}

function isEgressEnabled(): boolean {
  return isHlsEgressEnabled()
}

export function getHlsSegmentsDirectory(): string {
  return process.env.HLS_SEGMENTS_DIR?.trim() || '/app/hls-segments'
}

export async function getStreamHealthSnapshot(): Promise<StreamHealthSnapshot> {
  const livekit = getLiveKitConfigOrNull()
  const segmentsPath = getHlsSegmentsDirectory()
  let hlsSegmentsWritable: boolean | undefined

  if (isEgressEnabled()) {
    try {
      await access(segmentsPath)
      hlsSegmentsWritable = true
    } catch {
      hlsSegmentsWritable = false
    }
  }

  return {
    egressConfigured: isEgressEnabled(),
    hlsSegmentsPath: isEgressEnabled() ? path.normalize(segmentsPath) : undefined,
    hlsSegmentsWritable,
    livekitConfigured: Boolean(livekit),
    livekitUrl: livekit?.url,
  }
}

export async function checkLiveKitReachable(): Promise<boolean> {
  const livekit = getLiveKitConfigOrNull()

  if (!livekit) {
    return false
  }

  const httpUrl = livekit.url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')

  try {
    const response = await fetch(httpUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })

    return response.ok || response.status === 404 || response.status === 405
  } catch {
    return false
  }
}

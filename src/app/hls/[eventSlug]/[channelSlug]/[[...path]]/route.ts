import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import { prepareServedHlsManifest } from '@/lib/streaming/hls-manifest-server'
import { LIVE_HLS_PLAYLIST_NAME } from '@/lib/streaming/ll-hls-config'
import { getHlsSegmentsDirectory } from '@/lib/stream-health'

type RouteParams = {
  params: Promise<{
    channelSlug: string
    eventSlug: string
    path?: string[]
  }>
}

function contentTypeForFile(filePath: string): string {
  if (filePath.endsWith('.m3u8')) {
    return 'application/vnd.apple.mpegurl'
  }

  if (filePath.endsWith('.ts')) {
    return 'video/mp2t'
  }

  if (filePath.endsWith('.mp4')) {
    return 'video/mp4'
  }

  return 'application/octet-stream'
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { channelSlug, eventSlug, path: pathSegments = [] } = await params
  let relativePath = pathSegments.length > 0 ? pathSegments.join('/') : LIVE_HLS_PLAYLIST_NAME

  if (relativePath === 'index.m3u8') {
    relativePath = LIVE_HLS_PLAYLIST_NAME
  }

  const baseDirectory = path.join(getHlsSegmentsDirectory(), eventSlug, channelSlug)
  const resolvedPath = path.normalize(path.join(baseDirectory, relativePath))

  if (!resolvedPath.startsWith(path.normalize(baseDirectory))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const fileContents = await readFile(resolvedPath)
    const isManifest = relativePath.endsWith('.m3u8')
    const body = isManifest
      ? await prepareServedHlsManifest(fileContents.toString('utf8'), path.basename(relativePath), baseDirectory)
      : fileContents

    return new NextResponse(body, {
      headers: {
        'Cache-Control': isManifest ? 'no-cache, no-store, must-revalidate' : 'public, max-age=1',
        'Content-Type': contentTypeForFile(resolvedPath),
      },
    })
  } catch {
    return NextResponse.json({ error: 'HLS asset not found' }, { status: 404 })
  }
}

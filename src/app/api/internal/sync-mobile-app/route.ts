import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { syncMobileAppRelease } from '@/lib/mobile-app-release'

function isAuthorized(request: Request): boolean {
  const configuredToken = process.env.MOBILE_APP_SYNC_TOKEN?.trim()

  if (!configuredToken) {
    return false
  }

  const authorization = request.headers.get('authorization')?.trim()
  const syncHeader = request.headers.get('x-ablaut-sync-token')?.trim()

  return authorization === `Bearer ${configuredToken}` || syncHeader === configuredToken
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const release = await syncMobileAppRelease(payload, { force: true })

  if (!release) {
    return NextResponse.json({ error: 'Unable to sync mobile app release.' }, { status: 503 })
  }

  return NextResponse.json({
    ok: true,
    latestTag: release.latestTag,
    latestVersion: release.latestVersion,
    downloadPageUrl: release.downloadPageUrl,
  })
}

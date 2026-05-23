import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { loadPublicMobileAppRelease } from '@/lib/mobile-app-release'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const release = await loadPublicMobileAppRelease(payload)

  if (!release?.downloadUrl) {
    return NextResponse.json({ error: 'Android app release is not available yet.' }, { status: 404 })
  }

  return NextResponse.redirect(release.downloadUrl, 302)
}

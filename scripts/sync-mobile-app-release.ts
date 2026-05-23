import 'dotenv/config'

import config from '@/payload.config'
import { getPayload } from 'payload'

import { syncMobileAppRelease } from '@/lib/mobile-app-release'

const payloadConfig = await config
const payload = await getPayload({ config: payloadConfig })
const release = await syncMobileAppRelease(payload, { force: true })

if (!release?.latestVersion) {
  console.error('Unable to sync mobile app release metadata.')
  process.exit(1)
}

console.log(
  `Synced ablaut Android app ${release.latestTag ?? release.latestVersion} -> ${release.downloadPageUrl}`,
)

process.exit(0)

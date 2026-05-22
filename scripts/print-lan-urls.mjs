import { networkInterfaces } from 'node:os'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function detectLanIPv4() {
  const nets = networkInterfaces()

  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue
      }

      if (entry.address.startsWith('169.254.')) {
        continue
      }

      return entry.address
    }
  }

  return null
}

function upsertEnvValue(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm')

  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`)
  }

  return `${content.trimEnd()}\n${key}=${value}\n`
}

const lanIp = detectLanIPv4()
const appPort = process.env.APP_PORT || '3000'
const livekitPort = process.env.LIVEKIT_PORT || '7880'

if (!lanIp) {
  console.error('Could not detect a LAN IPv4 address. Connect to Wi‑Fi/Ethernet and try again.')
  process.exit(1)
}

const appUrl = `http://${lanIp}:${appPort}`
const livekitUrl = `ws://${lanIp}:${livekitPort}`
const hlsUrl = `${appUrl}/hls`

console.log('')
console.log('Phone / tablet testing URLs (same Wi‑Fi as this PC):')
console.log('')
console.log(`  App:     ${appUrl}`)
console.log(`  LiveKit: ${livekitUrl}`)
console.log(`  HLS:     ${hlsUrl}`)
console.log('')
console.log('Recommended split test setup:')
console.log(`  PC speaker (mic works):  http://localhost:${appPort}/speak/{event}/{channel}`)
console.log(`  Phone listener:          ${appUrl}/listen/{event}/{channel}`)
console.log('  Same LiveKit room — you do NOT need the LAN URL on the PC for publishing.')
console.log('')
console.log('Windows Firewall: allow inbound TCP 3000, 7880, 7881 and UDP 50000-50100 if prompted.')
console.log('Phone and PC must be on the same network.')
console.log('')
console.log('IMPORTANT — microphone / WebRTC on phones:')
console.log('  Browsers block mic + WebRTC on plain HTTP (except localhost).')
console.log('  http://192.168.x.x is NOT trusted for the speaker mic or WebRTC.')
console.log('')
console.log('Easiest dev fix on Android Chrome (same Wi‑Fi, no HTTPS setup):')
console.log('  1. On the phone, open chrome://flags')
console.log('  2. Find "Insecure origins treated as secure"')
console.log(`  3. Add: ${appUrl}`)
console.log(`  4. Relaunch Chrome, then open ${appUrl} again`)
console.log('  (Dev-only flag — remove after testing.)')
console.log('')
console.log('Listener-only test (no mic on phone): WebRTC may still fail on HTTP.')
console.log('  Use HTTPS via a tunnel, or the Android flag above.')
console.log('')
console.log('HTTPS tunnel option (works on iPhone too):')
console.log('  Terminal 1: ngrok http 3000')
console.log('  Terminal 2: ngrok http 7880')
console.log('  Set PUBLIC_BASE_URL to the app https URL and LIVEKIT_PUBLIC_URL to wss://…7880')
console.log('  Restart: docker compose up -d --build app')
console.log('')

const shouldWriteEnv = process.argv.includes('--write-env')

if (shouldWriteEnv) {
  const envPath = resolve(process.cwd(), '.env')

  try {
    let content = readFileSync(envPath, 'utf8')
    content = upsertEnvValue(content, 'NEXT_PUBLIC_APP_URL', appUrl)
    content = upsertEnvValue(content, 'PUBLIC_BASE_URL', appUrl)
    content = upsertEnvValue(content, 'HLS_PUBLIC_BASE_URL', hlsUrl)
    content = upsertEnvValue(content, 'LIVEKIT_PUBLIC_URL', livekitUrl)
    writeFileSync(envPath, content, 'utf8')
    console.log(`Updated ${envPath}`)
    console.log('Restart the app container: docker compose up -d --build app')
    console.log('')
  } catch (error) {
    console.error(`Could not update .env: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
} else {
console.log('If the phone cannot connect at all, run on the PC:')
console.log('  npm run lan:doctor')
console.log('  .\\scripts\\open-lan-firewall.ps1   (PowerShell as Administrator)')
console.log('')
}

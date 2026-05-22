const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000'

async function check(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`)
  const body = await response.text()

  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}: ${body}`)
  }

  return body
}

async function main() {
  const healthRaw = await check('/api/health?deep=1', 200)
  const health = JSON.parse(healthRaw)

  if (!health.ok) {
    throw new Error('Health check reported ok=false')
  }

  console.log('Smoke checks passed:')
  console.log(`- health ok=${health.ok} dbReady=${health.dbReady}`)
  console.log(`- livekitConfigured=${health.stream?.livekitConfigured ?? false}`)
  console.log(`- egressConfigured=${health.stream?.egressConfigured ?? false}`)
  console.log('- Manual follow-ups: /organizations, /events, /listen/... WebRTC + compatibility mode')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

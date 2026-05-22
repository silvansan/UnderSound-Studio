import { Client } from 'pg'

const databaseUri = process.env.DATABASE_URI?.trim()
const maxAttempts = Number(process.env.PAYLOAD_DB_WAIT_ATTEMPTS ?? 30)
const delayMs = Number(process.env.PAYLOAD_DB_WAIT_DELAY_MS ?? 2000)

if (!databaseUri) {
  console.warn('DATABASE_URI is not set; skipping database wait.')
  process.exit(0)
}

const client = new Client({ connectionString: databaseUri })

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await client.connect()
    await client.query('SELECT 1')
    await client.end()
    console.log('PostgreSQL is ready.')
    process.exit(0)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`PostgreSQL not ready (attempt ${attempt}/${maxAttempts}): ${message}`)

    try {
      await client.end()
    } catch {
      // Ignore disconnect errors while retrying.
    }

    if (attempt === maxAttempts) {
      console.error('Timed out waiting for PostgreSQL.')
      process.exit(1)
    }

    await new Promise((resolve) => {
      setTimeout(resolve, delayMs)
    })
  }
}

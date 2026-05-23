import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

const runDatabaseTests = process.env.ABLAUT_RUN_DB_TESTS === 'true'

let payload: Payload

describe.skipIf(!runDatabaseTests)('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})

describe('API test prerequisites', () => {
  it('runs database-backed tests only when ABLAUT_RUN_DB_TESTS=true', () => {
    expect(typeof runDatabaseTests).toBe('boolean')
  })
})

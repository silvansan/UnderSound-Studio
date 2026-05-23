import { describe, expect, it, beforeEach } from 'vitest'

import {
  purgeExpiredRateLimitBuckets,
  rateLimitRequest,
  resetRateLimitBucketsForTests,
} from '@/lib/rate-limit'

function buildRequest(ip = '203.0.113.10'): Request {
  return new Request('http://localhost/api/livekit/listener-token', {
    headers: {
      'x-forwarded-for': ip,
    },
    method: 'POST',
  })
}

describe('rateLimitRequest', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests()
  })

  it('allows requests under the configured limit', () => {
    const request = buildRequest()

    expect(rateLimitRequest(request, 'listener-token', { limit: 2, windowMs: 60_000 })).toBeNull()
    expect(rateLimitRequest(request, 'listener-token', { limit: 2, windowMs: 60_000 })).toBeNull()
  })

  it('returns 429 once the limit is exceeded', () => {
    const request = buildRequest()

    expect(rateLimitRequest(request, 'listener-token', { limit: 1, windowMs: 60_000 })).toBeNull()

    const blocked = rateLimitRequest(request, 'listener-token', { limit: 1, windowMs: 60_000 })

    expect(blocked?.status).toBe(429)
    expect(blocked?.headers.get('Retry-After')).toBeTruthy()
  })

  it('tracks limits separately per client IP', () => {
    const firstClient = buildRequest('203.0.113.10')
    const secondClient = buildRequest('203.0.113.11')

    expect(rateLimitRequest(firstClient, 'listener-token', { limit: 1, windowMs: 60_000 })).toBeNull()
    expect(rateLimitRequest(secondClient, 'listener-token', { limit: 1, windowMs: 60_000 })).toBeNull()
    expect(rateLimitRequest(firstClient, 'listener-token', { limit: 1, windowMs: 60_000 })?.status).toBe(429)
    expect(rateLimitRequest(secondClient, 'listener-token', { limit: 1, windowMs: 60_000 })?.status).toBe(429)
  })

  it('purges expired buckets', () => {
    const request = buildRequest()

    expect(rateLimitRequest(request, 'listener-token', { limit: 1, windowMs: 1_000 })).toBeNull()
    expect(rateLimitRequest(request, 'listener-token', { limit: 1, windowMs: 1_000 })?.status).toBe(429)

    const removed = purgeExpiredRateLimitBuckets(Date.now() + 2_000)
    expect(removed).toBeGreaterThan(0)
    expect(rateLimitRequest(request, 'listener-token', { limit: 1, windowMs: 1_000 })).toBeNull()
  })
})

import { NextResponse } from 'next/server'

type RateLimitBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

  return forwardedFor || request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimitRequest(
  request: Request,
  key: string,
  options: {
    limit: number
    windowMs: number
  },
): NextResponse | null {
  const now = Date.now()
  const bucketKey = `${key}:${getClientIP(request)}`
  const bucket = buckets.get(bucketKey)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return null
  }

  bucket.count += 1

  if (bucket.count <= options.limit) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

  return NextResponse.json(
    { error: 'Too many requests' },
    {
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
      status: 429,
    },
  )
}

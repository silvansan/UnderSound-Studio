import { NextResponse } from 'next/server'

import { isPayloadReady } from '@/lib/app-readiness'
import { checkLiveKitReachable, getStreamHealthSnapshot } from '@/lib/stream-health'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const deep = url.searchParams.get('deep') === '1'
  const dbReady = isPayloadReady()
  const stream = await getStreamHealthSnapshot()
  const livekitReachable = deep ? await checkLiveKitReachable() : undefined

  if (deep && !dbReady) {
    return NextResponse.json(
      {
        dbReady: false,
        livekitReachable,
        ok: false,
        service: 'ablaut',
        stream,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  const ok = deep ? dbReady : true

  return NextResponse.json(
    {
      dbReady,
      livekitReachable,
      ok,
      service: 'ablaut',
      stream,
      timestamp: new Date().toISOString(),
    },
    { status: deep && !dbReady ? 503 : 200 },
  )
}

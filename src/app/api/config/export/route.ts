import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { exportAblautConfig } from '@/lib/config-transfer'
import { rateLimitRequest } from '@/lib/rate-limit'
import type { User } from '@/payload-types'

export async function GET(request: Request) {
  const rateLimited = rateLimitRequest(request, 'config-export', {
    limit: 20,
    windowMs: 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')
  const config = await exportAblautConfig(user as User, scope)
  const body = JSON.stringify(config, null, 2)
  const fileScope = scope === 'channels' || scope === 'full' ? scope : 'events'

  return new Response(body, {
    headers: {
      'Content-Disposition': `attachment; filename="ablaut-${fileScope}-config.json"`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

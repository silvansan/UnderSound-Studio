import { NextResponse } from 'next/server'

import { getRequestBaseUrl } from '@/lib/links'
import { buildPublicEventDirectoryResponse } from '@/lib/public-channel'

type RouteContext = {
  params: Promise<{ eventSlug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { eventSlug } = await params
  const publicBaseUrl = await getRequestBaseUrl()
  const directory = await buildPublicEventDirectoryResponse(eventSlug, publicBaseUrl)

  if (!directory) {
    return NextResponse.json({ error: 'Event listener directory not found' }, { status: 404 })
  }

  return NextResponse.json(directory)
}

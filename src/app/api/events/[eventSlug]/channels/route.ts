import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = {
  params: Promise<{ eventSlug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { eventSlug } = await params
  const payload = await getPayload({ config: configPromise })

  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: eventSlug,
      },
    },
  })
  const event = events.docs[0]

  if (!event || event.status !== 'active') {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
      ],
    },
  })

  return NextResponse.json({
    channels: channels.docs.map((channel) => ({
      description: channel.description,
      hlsEnabled: channel.hlsEnabled,
      icecastFallbackUrl: channel.icecastFallbackUrl,
      languageCode: channel.languageCode,
      languageLabel: channel.languageLabel,
      listenerPageEnabled: channel.listenerPageEnabled,
      listenerTokenMode: channel.listenerTokenMode,
      name: channel.name,
      slug: channel.slug,
      speakerPageEnabled: channel.speakerPageEnabled,
      webrtcEnabled: channel.webrtcEnabled,
    })),
    event: {
      defaultLanguage: event.defaultLanguage,
      publicListenerEnabled: event.publicListenerEnabled,
      slug: event.slug,
      title: event.title,
    },
  })
}

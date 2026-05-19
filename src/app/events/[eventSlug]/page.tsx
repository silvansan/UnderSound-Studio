import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { ChannelRow } from '@/components/ChannelRow'
import { TruncatedList } from '@/components/TruncatedList'
import { EventSettingsDrawer } from '@/components/EventSettingsDrawer'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardChannels, getDashboardEvent } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { isAdminUser } from '@/lib/permissions'
import { generateQrDataUrl } from '@/lib/qrcode'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ settings?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  return {
    title: event?.title ?? eventSlug,
  }
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { settings } = await searchParams
  const [event, channels] = await Promise.all([getDashboardEvent(eventSlug), getDashboardChannels(eventSlug)])

  if (!event) {
    notFound()
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const canManageAssignments = isAdminUser(user)
  const [eventRecord, assignments] = await Promise.all([
    payload.find({
      collection: 'events',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        slug: {
          equals: eventSlug,
        },
      },
    }),
    payload.find({
      collection: 'event-assignments',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'roleForEvent',
      user,
      where: {
        event: {
          equals: event.id,
        },
      },
    }),
  ])
  const fullEvent = eventRecord.docs[0]

  if (!fullEvent) {
    notFound()
  }

  const publicBaseUrl = await getRequestBaseUrl()
  const channelRows = await Promise.all(
    channels.map(async (channel) => {
      const listenerUrl = getListenerUrl(eventSlug, channel.slug, publicBaseUrl)
      const speakerUrl = getSpeakerUrl(eventSlug, channel.slug, publicBaseUrl)
      const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
        generateQrDataUrl(listenerUrl),
        generateQrDataUrl(speakerUrl),
      ])

      return {
        channel,
        listenerQrDataUrl,
        listenerUrl,
        speakerQrDataUrl,
        speakerUrl,
      }
    }),
  )

  return (
    <Layout hideFooter hideHeader title={event.title}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
          <span className="us-chip us-chip-blue">
            {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'}
          </span>
          {event.location ? <span className="us-chip us-chip-muted">{event.location}</span> : null}
          {event.publicListenerEnabled === false ? (
            <span className="us-chip us-chip-warning">Public listeners off</span>
          ) : null}
          <Link className="us-button-secondary ml-auto px-3 py-2 text-sm font-medium" href={`/channels?event=${eventSlug}`}>
            All channels
          </Link>
        </div>

        {event.description ? (
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {event.description}
          </p>
        ) : null}

        <EventSettingsDrawer
          assignments={assignments.docs}
          canManageAssignments={canManageAssignments}
          defaultOpen={settings === 'open'}
          event={fullEvent}
        />

        <article className="us-panel px-5 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Channels
            </p>
            <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
              Add channel
            </Link>
          </div>

          {channelRows.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <TruncatedList as="ul" itemLabel="channels" listClassName="min-w-[840px] space-y-2">
                {channelRows.map((item) => (
                  <ChannelRow
                    channelId={item.channel.id}
                    description={item.channel.description}
                    enabled={item.channel.enabled}
                    eventSlug={eventSlug}
                    key={item.channel.slug}
                    languageLabel={item.channel.languageLabel || item.channel.languageCode}
                    listenerPageEnabled={item.channel.listenerPageEnabled}
                    listenerQrDataUrl={item.listenerQrDataUrl}
                    listenerUrl={item.listenerUrl}
                    name={item.channel.name}
                    slug={item.channel.slug}
                    speakerPageEnabled={item.channel.speakerPageEnabled}
                    speakerQrDataUrl={item.speakerQrDataUrl}
                    speakerUrl={item.speakerUrl}
                  />
                ))}
              </TruncatedList>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border bg-white/70 px-4 py-5" style={{ borderColor: 'var(--us-border)' }}>
              <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                No channels yet.
              </p>
              <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium">
                Add first channel
              </Link>
            </div>
          )}
        </article>
      </section>
    </Layout>
  )
}

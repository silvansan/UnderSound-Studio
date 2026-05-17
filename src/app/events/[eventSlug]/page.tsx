import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ChannelRow } from '@/components/ChannelRow'
import { Layout } from '@/components/Layout'
import { getDashboardChannels, getDashboardEvent } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateQrDataUrl } from '@/lib/qrcode'
import { deleteEventAction } from '@/app/events/actions'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: PageProps) {
  const { eventSlug } = await params
  const [event, channels] = await Promise.all([getDashboardEvent(eventSlug), getDashboardChannels(eventSlug)])

  if (!event) {
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
    <Layout title={event.title}>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {event.title}
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              {event.description || 'No event description has been added yet.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="us-chip us-chip-blue">
                {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'}
              </span>
              {event.location ? <span className="us-chip us-chip-muted">{event.location}</span> : null}
              {event.publicListenerEnabled === false ? (
                <span className="us-chip us-chip-warning">Public listeners off</span>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Add channel
              </Link>
              <Link href={`/events/${eventSlug}/settings`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Event settings
              </Link>
              <Link href={`/events/${eventSlug}/edit`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Edit event
              </Link>
            </div>
          </article>

          <article className="us-panel px-5 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                  Channels
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                  {channels.length} {channels.length === 1 ? 'channel' : 'channels'} in this event.
                </p>
              </div>
              <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Add channel
              </Link>
            </div>

            {channelRows.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <div className="hidden min-w-[840px] grid-cols-[1.1fr_1fr_1.2fr_1.2fr_100px] gap-3 px-2 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
                  <span>Channel</span>
                  <span>Status</span>
                  <span>Speaker</span>
                  <span>Listener</span>
                  <span>Manage</span>
                </div>
                <ul className="min-w-[840px] space-y-2">
                  {channelRows.map((item) => (
                    <ChannelRow
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
                </ul>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border bg-white/70 px-4 py-5" style={{ borderColor: 'var(--us-border)' }}>
                <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                  No channels have been added to this event yet.
                </p>
                <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium">
                  Add first channel
                </Link>
              </div>
            )}
          </article>
        </div>

        <div className="space-y-4">
          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Event actions
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Deleting an event also removes its channels and event assignments.
            </p>
            <form action={deleteEventAction} className="mt-4">
              <input name="id" type="hidden" value={event.id} />
              <ConfirmSubmitButton confirmMessage="Delete this event? This also removes its channels and event assignments.">
                Delete event
              </ConfirmSubmitButton>
            </form>
          </article>
        </div>
      </section>
    </Layout>
  )
}

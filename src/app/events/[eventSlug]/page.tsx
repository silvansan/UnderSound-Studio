import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ChannelCard } from '@/components/ChannelCard'
import { Layout } from '@/components/Layout'
import { QRDrawer } from '@/components/QRDrawer'
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
  const qrItems = await Promise.all(
    channels.slice(0, 4).map(async (channel) => {
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
              <Link href={`/events/${eventSlug}/channels`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Manage channels
              </Link>
              <Link href={`/events/${eventSlug}/settings`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Event settings
              </Link>
              <Link href={`/events/${eventSlug}/edit`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Edit event
              </Link>
            </div>
          </article>

          {channels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {channels.map((channel) => (
                <ChannelCard
                  description={channel.description}
                  enabled={channel.enabled ?? undefined}
                  eventSlug={eventSlug}
                  key={channel.slug}
                  languageLabel={channel.languageLabel}
                  listenerPageEnabled={channel.listenerPageEnabled}
                  name={channel.name}
                  slug={channel.slug}
                  speakerPageEnabled={channel.speakerPageEnabled}
                />
              ))}
            </div>
          ) : (
            <article className="us-panel px-6 py-6">
              <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                No channels have been added to this event yet.
              </p>
            </article>
          )}
        </div>

        <div className="space-y-4">
          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Event actions
            </p>
            <form action={deleteEventAction} className="mt-4">
              <input name="id" type="hidden" value={event.id} />
              <button type="submit" className="rounded-2xl border px-4 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
                Delete event
              </button>
            </form>
          </article>

          {qrItems.length > 0 ? (
            qrItems.map((item) => (
              <div key={item.channel.slug} className="space-y-3">
                <p className="px-1 text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  {item.channel.name}
                </p>
                <QRDrawer
                  fileName={`${eventSlug}-${item.channel.slug}-listener.png`}
                  label="Listener QR"
                  qrDataUrl={item.listenerQrDataUrl}
                  url={item.listenerUrl}
                />
                <QRDrawer
                  fileName={`${eventSlug}-${item.channel.slug}-speaker.png`}
                  label="Speaker QR"
                  qrDataUrl={item.speakerQrDataUrl}
                  url={item.speakerUrl}
                />
              </div>
            ))
          ) : (
            <article className="us-panel px-6 py-6">
              <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                Add channels to generate listener and speaker QR drawers.
              </p>
            </article>
          )}
        </div>
      </section>
    </Layout>
  )
}

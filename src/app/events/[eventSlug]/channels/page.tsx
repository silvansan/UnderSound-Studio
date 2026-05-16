import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ChannelCard } from '@/components/ChannelCard'
import { Layout } from '@/components/Layout'
import { getDashboardChannels, getDashboardEvent } from '@/lib/dashboard-data'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventChannelsPage({ params }: PageProps) {
  const { eventSlug } = await params
  const [event, channels] = await Promise.all([getDashboardEvent(eventSlug), getDashboardChannels(eventSlug)])

  if (!event) {
    notFound()
  }

  return (
    <Layout title={`${event.title} channels`}>
      <section className="space-y-4">
        <article className="us-panel px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="us-chip us-chip-blue">Channels</span>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                Manage public listener and speaker links for channels in this event. Primary actions are grouped here;
                destructive channel edits remain in Payload admin.
              </p>
            </div>
            <Link href={`/events/${eventSlug}`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
              Back to event
            </Link>
            <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
              Add channel
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
              No channels exist for this event yet.
            </p>
            <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium">
              Add channel
            </Link>
          </article>
        )}
      </section>
    </Layout>
  )
}

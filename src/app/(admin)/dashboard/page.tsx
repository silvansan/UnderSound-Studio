import Link from 'next/link'

import { Layout } from '@/components/Layout'
import { getDashboardSummary } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const summary = await getDashboardSummary()

  return (
    <Layout title="Dashboard">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Active events', String(summary.activeEvents), 'Events currently marked active'],
          ['Draft events', String(summary.draftEvents), 'Events still being prepared'],
          ['Archived events', String(summary.archivedEvents), 'Closed or historical events'],
          ['Channels', String(summary.totalChannels), 'Translation/audio channels configured'],
        ].map(([label, value, hint]) => (
          <article key={label} className="us-panel px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {value}
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              {hint}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted">Admin workspace</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Event operations overview
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            This dashboard now reads from Payload records while keeping the branded admin surface lightweight. Payload
            admin remains the full back office for create/edit operations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="us-button-primary px-5 py-3 text-sm font-medium">
              Open Payload admin
            </Link>
            <Link href="/events" className="us-button-secondary px-5 py-3 text-sm font-medium">
              Browse events
            </Link>
            <Link href="/admin/collections/events/create" className="us-button-secondary px-5 py-3 text-sm font-medium">
              Quick create event
            </Link>
          </div>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Recently edited channels
          </p>
          {summary.recentChannels.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              {summary.recentChannels.map((channel) => (
                <li key={`${channel.eventSlug}-${channel.slug}`} className="flex items-center justify-between gap-3">
                  <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`} className="font-medium">
                    {channel.name}
                  </Link>
                  <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
                    {channel.enabled === false ? 'Disabled' : 'Enabled'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              No channels have been created yet.
            </p>
          )}
        </article>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.recentEvents.map((event) => (
          <article key={event.slug} className="us-panel px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                {event.title}
              </h3>
              <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
            </div>
            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'} configured
            </p>
            <Link href={`/events/${event.slug}`} className="us-button-secondary mt-4 inline-flex px-4 py-2.5 text-sm font-medium">
              Open event
            </Link>
          </article>
        ))}
      </section>
    </Layout>
  )
}

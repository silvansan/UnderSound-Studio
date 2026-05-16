import Link from 'next/link'

import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardSummary } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [summary, user, publicBaseUrl] = await Promise.all([getDashboardSummary(), requireAppUser(), getRequestBaseUrl()])
  const canCreateEvents = isAdminUser(user)
  const showPayloadAdmin = isSuperAdminUser(user)

  return (
    <Layout title="Dashboard">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Active events', String(summary.activeEvents), 'Events currently marked active', '/events?status=active'],
          ['Draft events', String(summary.draftEvents), 'Events still being prepared', '/events?status=draft'],
          ['Archived events', String(summary.archivedEvents), 'Closed or historical events', '/events?status=archived'],
          ['Channels', String(summary.totalChannels), 'Translation/audio channels configured', '/channels'],
        ].map(([label, value, hint, href]) => (
          <Link key={label} href={href} className="us-panel block px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {value}
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              {hint}
            </p>
          </Link>
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
            {showPayloadAdmin ? (
              <Link href="/admin" className="us-button-primary px-5 py-3 text-sm font-medium">
                Open Payload admin
              </Link>
            ) : null}
            <Link href="/events" className="us-button-secondary px-5 py-3 text-sm font-medium">
              Browse events
            </Link>
            {canCreateEvents ? (
              <Link href="/events/new" className="us-button-secondary px-5 py-3 text-sm font-medium">
                Quick create event
              </Link>
            ) : null}
          </div>
        </article>

        <article className="us-panel px-6 py-6 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Recently edited channels
          </p>
          {summary.recentChannels.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-[1fr_1fr_1.2fr_1.2fr_110px] gap-4 px-2 pb-3 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
                <span>Event</span>
                <span>Channel name</span>
                <span>Speaker&apos;s page</span>
                <span>Listener&apos;s page</span>
                <span>Enabled?</span>
              </div>
              <ul className="min-w-[720px] space-y-2 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              {summary.recentChannels.map((channel) => (
                <li key={`${channel.eventSlug}-${channel.slug}`} className="grid grid-cols-[1fr_1fr_1.2fr_1.2fr_110px] items-center gap-4 rounded-2xl bg-white/70 px-4 py-3">
                  <Link href={`/events/${channel.eventSlug}`} className="font-medium">
                    {channel.eventTitle}
                  </Link>
                  <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`} className="font-medium">
                    {channel.name}
                  </Link>
                  <div className="space-x-2">
                    <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`}>QR code</Link>
                    <a href={getSpeakerUrl(channel.eventSlug, channel.slug, publicBaseUrl)} target="_blank" rel="noreferrer">
                      Open new tab
                    </a>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`}>QR code</Link>
                    <a href={getListenerUrl(channel.eventSlug, channel.slug, publicBaseUrl)} target="_blank" rel="noreferrer">
                      Open link
                    </a>
                  </div>
                  <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
                    {channel.enabled === false ? 'Disabled' : 'Enabled'}
                  </span>
                </li>
              ))}
              </ul>
            </div>
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

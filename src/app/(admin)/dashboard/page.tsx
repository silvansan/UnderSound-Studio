import Link from 'next/link'
import type { Metadata } from 'next'

import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardSummary } from '@/lib/dashboard-data'
import { isAdminUser } from '@/lib/permissions'
import { pageMetadata } from '@/lib/branding'

export const metadata: Metadata = pageMetadata('Dashboard')

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [summary, user] = await Promise.all([getDashboardSummary(), requireAppUser()])
  const canCreateEvents = isAdminUser(user)
  const recentItems = [
    ...summary.recentChannels.slice(0, 4).map((channel) => ({
      href: `/events/${channel.eventSlug}/channels/${channel.slug}`,
      key: `channel-${channel.eventSlug}-${channel.slug}`,
      label: `${channel.eventTitle} · ${channel.name}`,
    })),
    ...summary.recentEvents.slice(0, 4).map((event) => ({
      href: `/events/${event.slug}`,
      key: `event-${event.slug}`,
      label: event.title,
    })),
  ].slice(0, 6)

  return (
    <Layout hideFooter hideHeader title="Dashboard">
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Active events', String(summary.activeEvents), '/events?status=active'],
            ['Draft events', String(summary.draftEvents), '/events?status=draft'],
            ['Archived events', String(summary.archivedEvents), '/events?status=archived'],
            ['Channels', String(summary.totalChannels), '/channels'],
          ].map(([label, value, href]) => (
            <Link key={label} href={href} className="us-panel block px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                {value}
              </p>
            </Link>
          ))}
        </div>

        {recentItems.length > 0 ? (
          <article className="us-panel px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                Recently updated
              </p>
              <div className="flex flex-wrap gap-2">
                <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href="/events">
                  All events
                </Link>
                <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href="/channels">
                  All channels
                </Link>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {recentItems.map((item) => (
                <li key={item.key}>
                  <Link className="text-sm font-medium hover:underline" href={item.href} style={{ color: 'var(--us-green-dark)' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {canCreateEvents ? (
          <Link className="us-button-primary inline-flex px-5 py-3 text-sm font-medium" href="/events/new">
            Create event
          </Link>
        ) : null}
      </section>
    </Layout>
  )
}

import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { canDeleteEvent } from '@/app/events/actions'
import { Layout } from '@/components/Layout'
import { EventRow } from '@/components/EventRow'
import { TruncatedList } from '@/components/TruncatedList'
import { getDashboardEvents } from '@/lib/dashboard-data'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { isAdminUser } from '@/lib/permissions'
export const metadata: Metadata = pageMetadata('Events')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const [events, user] = await Promise.all([getDashboardEvents(), requireAppUser()])
  const payload = await getPayload({ config: configPromise })
  const visibleEvents =
    status === 'active' || status === 'draft' || status === 'archived'
      ? events.filter((event) => event.status === status)
      : events
  const canCreateEvents = isAdminUser(user)

  const eventsWithDelete = await Promise.all(
    visibleEvents.map(async (event) => ({
      ...event,
      canDelete: await canDeleteEvent(payload, user, event),
    })),
  )

  return (
    <Layout hideFooter hideHeader title="Events">
      <section className="space-y-4">
        <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
          {[
            ['All', '/events'],
            ['Active', '/events?status=active'],
            ['Draft', '/events?status=draft'],
            ['Archived', '/events?status=archived'],
          ].map(([label, href]) => {
            const active =
              (label === 'All' && !status) ||
              (label === 'Active' && status === 'active') ||
              (label === 'Draft' && status === 'draft') ||
              (label === 'Archived' && status === 'archived')

            return (
              <Link
                key={label}
                className="rounded-2xl border px-4 py-2 text-sm font-medium"
                href={href}
                style={{
                  backgroundColor: active ? 'var(--us-green-dark)' : 'white',
                  borderColor: active ? 'var(--us-green-dark)' : 'var(--us-border)',
                  color: active ? 'white' : 'var(--us-text)',
                }}
              >
                {label}
              </Link>
            )
          })}
          {canCreateEvents ? (
            <Link className="us-button-primary ml-auto px-5 py-3 text-sm font-medium" href="/events/new">
              Create event
            </Link>
          ) : null}
        </div>

        {eventsWithDelete.length > 0 ? (
          <div className="us-panel overflow-hidden px-4 py-4">
            <div className="hidden grid-cols-[1.3fr_1fr_120px_auto] gap-3 px-2 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
              <span>Event</span>
              <span>Status</span>
              <span>When / where</span>
              <span>{eventsWithDelete.some((event) => event.canDelete) ? 'Delete' : ''}</span>
            </div>
            <TruncatedList as="ul" itemLabel="events" listClassName="space-y-2">
              {eventsWithDelete.map((event) => (
                <EventRow
                  canDelete={event.canDelete}
                  channelCount={event.channelCount}
                  dateStart={event.dateStart}
                  description={event.description}
                  eventId={event.id}
                  key={event.slug}
                  location={event.location}
                  slug={event.slug}
                  status={event.status ?? 'draft'}
                  title={event.title}
                />
              ))}
            </TruncatedList>
          </div>
        ) : (
          <div className="us-panel px-6 py-6">
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No events exist yet.
            </p>
          </div>
        )}
      </section>
    </Layout>
  )
}

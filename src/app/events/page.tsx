import { Layout } from '@/components/Layout'
import { EventRow } from '@/components/EventRow'
import { getDashboardEvents } from '@/lib/dashboard-data'
import Link from 'next/link'
import { requireAppUser } from '@/lib/app-auth'
import { isAdminUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const [events, user] = await Promise.all([getDashboardEvents(), requireAppUser()])
  const visibleEvents =
    status === 'active' || status === 'draft' || status === 'archived'
      ? events.filter((event) => event.status === status)
      : events
  const canCreateEvents = isAdminUser(user)

  return (
    <Layout title="Events">
      <section className="space-y-4">
        <div className="us-panel px-6 py-5">
          {status ? <span className="us-chip us-chip-muted capitalize">Showing {status} events</span> : null}
          {canCreateEvents ? (
            <Link href="/events/new" className={`${status ? 'mt-4 ' : ''}inline-flex us-button-primary px-5 py-3 text-sm font-medium`}>
              Create event
            </Link>
          ) : null}
        </div>

        {visibleEvents.length > 0 ? (
          <div className="us-panel overflow-hidden px-4 py-4">
            <div className="hidden grid-cols-[1.3fr_1fr_120px_120px] gap-3 px-2 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
              <span>Event</span>
              <span>Status</span>
              <span>When / where</span>
              <span>Open</span>
            </div>
            <ul className="space-y-2">
            {visibleEvents.map((event) => (
              <EventRow
                channelCount={event.channelCount}
                dateStart={event.dateStart}
                description={event.description}
                key={event.slug}
                location={event.location}
                slug={event.slug}
                status={event.status ?? 'draft'}
                title={event.title}
              />
            ))}
            </ul>
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

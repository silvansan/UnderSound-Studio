import { Layout } from '@/components/Layout'
import { EventCard } from '@/components/EventCard'
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
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Create, edit, and open events from the app-side dashboard.
            {status ? ` Showing ${status} events.` : ''}
          </p>
          {canCreateEvents ? (
            <Link href="/events/new" className="us-button-primary mt-4 inline-flex px-5 py-3 text-sm font-medium">
              Create event
            </Link>
          ) : null}
        </div>

        {visibleEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleEvents.map((event) => (
              <EventCard
                channelCount={event.channelCount}
                dateStart={event.dateStart}
                description={event.description}
                key={event.slug}
                slug={event.slug}
                status={event.status ?? 'draft'}
                title={event.title}
              />
            ))}
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

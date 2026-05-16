import { Layout } from '@/components/Layout'
import { EventCard } from '@/components/EventCard'
import { getDashboardEvents } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getDashboardEvents()

  return (
    <Layout title="Events">
      <section className="space-y-4">
        <div className="us-panel px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Events now load from Payload while keeping the branded route shell refresh-safe. Use Payload admin for
            create/edit operations, and use these pages for event overview, channel links, QR drawers, and public routes.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
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

import { EventForm } from '@/components/EventForm'
import { Layout } from '@/components/Layout'
import { createEventAction } from '@/app/events/actions'

export const dynamic = 'force-dynamic'

export default function NewEventPage() {
  return (
    <Layout title="Create Event">
      <section className="space-y-4">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-blue">Event setup</span>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Create the event here, then add channels from the event page.
          </p>
        </article>
        <EventForm action={createEventAction} submitLabel="Create event" />
      </section>
    </Layout>
  )
}

import { EventForm } from '@/components/EventForm'
import { Layout } from '@/components/Layout'
import { createEventAction } from '@/app/events/actions'

export const dynamic = 'force-dynamic'

export default function NewEventPage() {
  return (
    <Layout hideFooter hideHeader title="Create event">
      <EventForm action={createEventAction} submitLabel="Create event" />
    </Layout>
  )
}

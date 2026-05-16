import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { updateEventAction } from '@/app/events/actions'
import { EventForm } from '@/components/EventForm'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({ params }: PageProps) {
  const { eventSlug } = await params
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      slug: {
        equals: eventSlug,
      },
    },
  })
  const event = events.docs[0]

  if (!event) {
    notFound()
  }

  return (
    <Layout title={`Edit ${event.title}`}>
      <section className="space-y-4">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted">Event settings</span>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Update core event details from the app-side dashboard.
          </p>
        </article>
        <EventForm action={updateEventAction} event={event} submitLabel="Save event" />
      </section>
    </Layout>
  )
}

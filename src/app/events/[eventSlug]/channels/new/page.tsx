import { notFound } from 'next/navigation'

import { createChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelForm } from '@/components/ChannelForm'
import { Layout } from '@/components/Layout'
import { getDashboardEvent } from '@/lib/dashboard-data'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function NewChannelPage({ params }: PageProps) {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  return (
    <Layout title={`Add Channel to ${event.title}`}>
      <section className="space-y-4">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-blue">Channel setup</span>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Add a listener/speaker channel for this event.
          </p>
        </article>
        <ChannelForm action={createChannelAction} eventSlug={eventSlug} submitLabel="Create channel" />
      </section>
    </Layout>
  )
}

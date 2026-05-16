import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { updateChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelForm } from '@/components/ChannelForm'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEvent } from '@/lib/dashboard-data'

type PageProps = {
  params: Promise<{ channelSlug: string; eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditChannelPage({ params }: PageProps) {
  const { channelSlug, eventSlug } = await params
  const user = await requireAppUser()
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })
  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          slug: {
            equals: channelSlug,
          },
        },
      ],
    },
  })
  const channel = channels.docs[0]

  if (!channel) {
    notFound()
  }

  return (
    <Layout title={`Edit ${channel.name}`}>
      <section className="space-y-4">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted">Channel settings</span>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Update the app-side channel settings used by listener, speaker, QR, and LiveKit flows.
          </p>
        </article>
        <ChannelForm action={updateChannelAction} channel={channel} eventSlug={eventSlug} submitLabel="Save channel" />
      </section>
    </Layout>
  )
}

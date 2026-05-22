import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { EventDirectoryAccess, EventDirectoryChannelList } from '@/components/EventDirectoryPanel'
import { Layout } from '@/components/Layout'
import { getEventListenerSessionCookieName, verifyEventListenerSessionToken } from '@/lib/listener-password'
import { getRequestBaseUrl } from '@/lib/links'
import { buildPublicEventDirectoryResponse } from '@/lib/public-channel'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const publicBaseUrl = await getRequestBaseUrl()
  const directory = await buildPublicEventDirectoryResponse(eventSlug, publicBaseUrl)

  return {
    title: directory?.event.title ?? eventSlug,
  }
}

export default async function EventListenDirectoryPage({ params }: PageProps) {
  const { eventSlug } = await params
  const publicBaseUrl = await getRequestBaseUrl()
  const directory = await buildPublicEventDirectoryResponse(eventSlug, publicBaseUrl)

  if (!directory) {
    notFound()
  }

  const cookieStore = await cookies()
  const eventListenerSession = cookieStore.get(getEventListenerSessionCookieName(eventSlug))?.value
  const hasEventListenerSession = verifyEventListenerSessionToken(eventSlug, eventListenerSession)
  const hasAccess = !directory.access.listenerPasswordRequired || hasEventListenerSession

  return (
    <Layout hideHeader requireAuth={false} title="Listen">
      <section className="mx-auto max-w-2xl">
        <div className="us-panel us-hero-glow relative overflow-hidden px-6 py-8 text-center md:px-8">
          <div className="relative z-10">
            <span className="us-chip us-chip-blue">Event listener directory</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
              {directory.event.title}
            </h2>
            <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Choose a channel to listen. One QR code can open this list for the whole event.
            </p>

            <EventDirectoryAccess
              eventSlug={eventSlug}
              hasEventListenerSession={hasEventListenerSession}
              listenerPasswordRequired={directory.access.listenerPasswordRequired}
            />

            <EventDirectoryChannelList channels={directory.channels} eventSlug={eventSlug} hasAccess={hasAccess} />
          </div>
        </div>
      </section>
    </Layout>
  )
}

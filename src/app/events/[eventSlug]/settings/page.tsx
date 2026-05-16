import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Layout } from '@/components/Layout'
import { getDashboardEvent } from '@/lib/dashboard-data'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventSettingsPage({ params }: PageProps) {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  return (
    <Layout title={`${event.title} settings`}>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            {event.title}
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            This branded settings page summarizes the current event state. Edit sensitive settings, passwords, and
            dangerous actions in Payload admin.
          </p>
          <dl className="mt-5 grid gap-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            <div>
              <dt className="font-semibold">Public listeners</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.publicListenerEnabled === false ? 'Disabled' : 'Enabled'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Default language</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.defaultLanguage || 'Not set'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Channels</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.channelCount}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/events/${eventSlug}`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
              Back to event
            </Link>
            <Link href="/admin/collections/events" className="us-button-primary px-4 py-2.5 text-sm font-medium">
              Open events in admin
            </Link>
          </div>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Settings areas
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            <li>Event access and public listener flags</li>
            <li>Speaker password policy and hashed password replacement</li>
            <li>Theme override and QR defaults</li>
            <li>Assigned admin and moderator overview</li>
          </ul>
        </article>
      </section>
    </Layout>
  )
}

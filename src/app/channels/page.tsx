import Link from 'next/link'

import { Layout } from '@/components/Layout'
import { getDashboardAllChannels } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  const [channels, publicBaseUrl] = await Promise.all([getDashboardAllChannels(), getRequestBaseUrl()])

  return (
    <Layout title="Channels">
      <section className="space-y-4">
        <article className="us-panel px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            All channels you can access, with quick links for speaker and listener pages.
          </p>
        </article>

        <article className="us-panel overflow-hidden px-4 py-4">
          <div className="hidden grid-cols-[1fr_1fr_1.2fr_1.2fr_110px] gap-4 px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
            <span>Event</span>
            <span>Channel name</span>
            <span>Speaker&apos;s page</span>
            <span>Listener&apos;s page</span>
            <span>Enabled?</span>
          </div>

          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={`${channel.eventSlug}-${channel.slug}`} className="grid gap-3 rounded-3xl border bg-white/75 px-4 py-4 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_110px] lg:items-center" style={{ borderColor: 'var(--us-border)' }}>
                <Link href={`/events/${channel.eventSlug}`} className="font-medium" style={{ color: 'var(--us-green-dark)' }}>
                  {channel.eventTitle}
                </Link>
                <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`} className="font-medium">
                  {channel.name}
                </Link>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`}>QR code</Link>
                  <a href={getSpeakerUrl(channel.eventSlug, channel.slug, publicBaseUrl)} rel="noreferrer" target="_blank">
                    Open new tab
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link href={`/events/${channel.eventSlug}/channels/${channel.slug}`}>QR code</Link>
                  <a href={getListenerUrl(channel.eventSlug, channel.slug, publicBaseUrl)} rel="noreferrer" target="_blank">
                    Open link
                  </a>
                </div>
                <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'} w-fit`}>
                  {channel.enabled === false ? 'Disabled' : 'Enabled'}
                </span>
              </div>
            ))}
            {channels.length === 0 ? (
              <p className="px-2 py-4 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                No channels are available.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </Layout>
  )
}

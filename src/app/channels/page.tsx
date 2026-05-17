import Link from 'next/link'
import type { Metadata } from 'next'

import { createChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelRow } from '@/components/ChannelRow'
import { Layout } from '@/components/Layout'
import { getDashboardAllChannels, getDashboardEvents } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateQrDataUrl } from '@/lib/qrcode'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Channels',
}

type ChannelsPageProps = {
  searchParams?: Promise<{
    event?: string
    q?: string
  }>
}

export default async function ChannelsPage({ searchParams }: ChannelsPageProps) {
  const params = await searchParams
  const selectedEvent = params?.event ?? ''
  const searchQuery = params?.q?.trim() ?? ''
  const normalizedQuery = searchQuery.toLowerCase()
  const [channels, events, publicBaseUrl] = await Promise.all([
    getDashboardAllChannels(1000),
    getDashboardEvents(1000),
    getRequestBaseUrl(),
  ])
  const filteredChannels = channels.filter((channel) => {
    const matchesEvent = !selectedEvent || channel.eventSlug === selectedEvent
    const matchesQuery =
      !normalizedQuery ||
      [channel.name, channel.languageCode, channel.languageLabel, channel.eventTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))

    return matchesEvent && matchesQuery
  })
  const channelRows = await Promise.all(
    filteredChannels.map(async (channel) => {
      const listenerUrl = getListenerUrl(channel.eventSlug, channel.slug, publicBaseUrl)
      const speakerUrl = getSpeakerUrl(channel.eventSlug, channel.slug, publicBaseUrl)
      const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
        generateQrDataUrl(listenerUrl),
        generateQrDataUrl(speakerUrl),
      ])

      return {
        ...channel,
        listenerQrDataUrl,
        listenerUrl,
        speakerQrDataUrl,
        speakerUrl,
      }
    }),
  )

  return (
    <Layout title="Channels">
      <section className="space-y-4">
        <article className="us-panel px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            All channels you can access, with quick links for speaker and listener pages.
          </p>
        </article>

        <article className="us-panel px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Find channels
          </p>
          <form className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]" action="/channels">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Event
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={selectedEvent}
                name="event"
                style={{ borderColor: 'var(--us-border)' }}
              >
                <option value="">All events</option>
                {events.map((event) => (
                  <option key={event.slug} value={event.slug}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Channel search
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={searchQuery}
                name="q"
                placeholder="Name, language, or event"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <div className="flex items-end gap-2">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Filter
              </button>
              <Link className="us-button-secondary px-4 py-3 text-sm font-medium" href="/channels">
                Clear
              </Link>
            </div>
          </form>
        </article>

        <article className="us-panel px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Quick add channel
          </p>
          <form action={createChannelAction} className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_140px_1fr_auto]">
            <input name="enabled" type="hidden" value="on" />
            <input name="listenerPageEnabled" type="hidden" value="on" />
            <input name="listenerTokenMode" type="hidden" value="public" />
            <input name="speakerPageEnabled" type="hidden" value="on" />
            <input name="webrtcEnabled" type="hidden" value="on" />
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Event
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={selectedEvent}
                name="eventSlug"
                required
                style={{ borderColor: 'var(--us-border)' }}
              >
                <option value="">Choose event</option>
                {events.map((event) => (
                  <option key={event.slug} value={event.slug}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Channel name
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="name"
                placeholder="English floor audio"
                required
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Code
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="languageCode"
                placeholder="en"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Language label
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="languageLabel"
                placeholder="English"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <div className="flex items-end">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Add
              </button>
            </div>
          </form>
        </article>

        <article className="us-panel overflow-hidden px-4 py-4">
          <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_1.2fr_100px] gap-3 px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
            <span>Channel</span>
            <span>Status</span>
            <span>Speaker</span>
            <span>Listener</span>
            <span>Manage</span>
          </div>

          <div className="space-y-3">
            {channelRows.map((channel) => (
              <ChannelRow
                description={channel.eventTitle}
                enabled={channel.enabled}
                eventSlug={channel.eventSlug}
                key={`${channel.eventSlug}-${channel.slug}`}
                languageLabel={channel.languageLabel || channel.languageCode}
                listenerPageEnabled={channel.listenerPageEnabled}
                listenerQrDataUrl={channel.listenerQrDataUrl}
                listenerUrl={channel.listenerUrl}
                name={channel.name}
                slug={channel.slug}
                speakerPageEnabled={channel.speakerPageEnabled}
                speakerQrDataUrl={channel.speakerQrDataUrl}
                speakerUrl={channel.speakerUrl}
              />
            ))}
            {channelRows.length === 0 ? (
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

import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { IconActionLink } from '@/components/ActionIcons'
import { ChannelAdvancedSettings } from '@/components/ChannelAdvancedSettings'
import { InlineEditField } from '@/components/InlineEditField'
import { Layout } from '@/components/Layout'
import { QRPopup } from '@/components/QRPopup'
import { requireAppUser } from '@/lib/app-auth'
import { formatEventChannelTitle } from '@/lib/branding'
import { getDashboardChannel, getDashboardEvent } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateQrDataUrl } from '@/lib/qrcode'
import { updateChannelSummaryAction } from '@/app/events/[eventSlug]/channels/actions'
import { eventListenerPasswordConfigured } from '@/lib/listener-password'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
  searchParams: Promise<{ settings?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug, channelSlug } = await params
  const [event, channel] = await Promise.all([
    getDashboardEvent(eventSlug),
    getDashboardChannel(eventSlug, channelSlug),
  ])

  const eventTitle = event?.title ?? eventSlug
  const channelName = channel?.name ?? channelSlug

  return {
    title: formatEventChannelTitle(eventTitle, channelName),
  }
}

export default async function ChannelDetailPage({ params, searchParams }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const { settings } = await searchParams
  const channel = await getDashboardChannel(eventSlug, channelSlug)

  if (!channel) {
    notFound()
  }

  const user = await requireAppUser()
  const event = await getDashboardEvent(eventSlug)
  const payload = await getPayload({ config: configPromise })
  const [channelsResult, eventsResult] = event
    ? await Promise.all([
        payload.find({
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
        }),
        payload.find({
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
        }),
      ])
    : [null, null]

  const channelSettings = channelsResult?.docs[0]
  const eventRecord = eventsResult?.docs[0]

  if (!channelSettings || !eventRecord) {
    notFound()
  }

  const listenerPasswordReady = eventListenerPasswordConfigured(eventRecord)

  const publicBaseUrl = await getRequestBaseUrl()
  const listenerUrl = getListenerUrl(eventSlug, channelSlug, publicBaseUrl)
  const speakerUrl = getSpeakerUrl(eventSlug, channelSlug, publicBaseUrl)
  const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
    generateQrDataUrl(listenerUrl),
    generateQrDataUrl(speakerUrl),
  ])

  return (
    <Layout hideFooter hideHeader title={channel.name}>
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
            {channel.enabled === false ? 'Disabled' : 'Enabled'}
          </span>
          {channel.languageLabel || channel.languageCode ? (
            <span className="us-chip us-chip-muted">{channel.languageLabel || channel.languageCode}</span>
          ) : null}
          <Link className="us-button-secondary ml-auto px-3 py-2 text-sm font-medium" href={`/events/${eventSlug}`}>
            Back to event
          </Link>
        </div>

        <article className="us-panel flex flex-wrap items-center gap-3 px-4 py-4">
          <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Links
          </span>
          <QRPopup
            fileName={`${eventSlug}-${channelSlug}-listener.png`}
            label={`${channel.name} listener`}
            qrDataUrl={listenerQrDataUrl}
            triggerLabel="Listener QR"
            url={listenerUrl}
          />
          <IconActionLink href={listenerUrl} icon="open" target="_blank">
            Listener page
          </IconActionLink>
          <QRPopup
            fileName={`${eventSlug}-${channelSlug}-speaker.png`}
            label={`${channel.name} speaker`}
            qrDataUrl={speakerQrDataUrl}
            triggerLabel="Speaker QR"
            url={speakerUrl}
          />
          <IconActionLink href={speakerUrl} icon="open" target="_blank">
            Speaker page
          </IconActionLink>
        </article>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="us-panel px-6 py-6">
            <div className="mt-1">
              <InlineEditField
                action={updateChannelSummaryAction}
                fieldName="name"
                hiddenFields={{ channelSlug, eventSlug, id: channel.id }}
                inputLabel="Channel name"
                value={channel.name}
              >
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                  {channel.name}
                </h2>
              </InlineEditField>
            </div>
            <div className="mt-3">
              <InlineEditField
                action={updateChannelSummaryAction}
                fieldName="description"
                hiddenFields={{ channelSlug, eventSlug, id: channel.id }}
                inputLabel="Description"
                multiline
                placeholder="Add a short channel description"
                value={channel.description ?? ''}
              >
                <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                  {channel.description || 'No description yet.'}
                </p>
              </InlineEditField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {channel.webrtcEnabled === false ? <span className="us-chip us-chip-warning">WebRTC off</span> : null}
              {channel.hlsEnabled ? <span className="us-chip us-chip-blue">HLS enabled</span> : null}
              {channel.icecastFallbackUrl ? <span className="us-chip us-chip-blue">Fallback configured</span> : null}
            </div>
          </article>

          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Room & routes
            </p>
            <dl className="mt-4 grid gap-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              <div>
                <dt className="font-semibold">LiveKit room</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  {channel.livekitRoomName || channel.roomName || `ablaut_${eventSlug}_${channelSlug}`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Listener</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  /listen/{eventSlug}/{channelSlug}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Speaker</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  /speak/{eventSlug}/{channelSlug}
                </dd>
              </div>
            </dl>
          </article>

          <div className="xl:col-span-2">
            <ChannelAdvancedSettings
              channel={channelSettings}
              defaultOpen={settings === 'open'}
              eventListenerPasswordConfigured={listenerPasswordReady}
              eventSlug={eventSlug}
            />
          </div>
        </div>
      </section>
    </Layout>
  )
}

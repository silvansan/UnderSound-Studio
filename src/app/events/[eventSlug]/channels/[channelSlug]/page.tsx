import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { InlineEditField } from '@/components/InlineEditField'
import { Layout } from '@/components/Layout'
import { QRActionCard } from '@/components/QRActionCard'
import { getDashboardChannel } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateQrDataUrl } from '@/lib/qrcode'
import { deleteChannelAction, updateChannelSummaryAction } from '@/app/events/[eventSlug]/channels/actions'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function ChannelDetailPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const channel = await getDashboardChannel(eventSlug, channelSlug)

  if (!channel) {
    notFound()
  }

  const publicBaseUrl = await getRequestBaseUrl()
  const listenerUrl = getListenerUrl(eventSlug, channelSlug, publicBaseUrl)
  const speakerUrl = getSpeakerUrl(eventSlug, channelSlug, publicBaseUrl)
  const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
    generateQrDataUrl(listenerUrl),
    generateQrDataUrl(speakerUrl),
  ])

  return (
    <Layout title={channel.name}>
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <QRActionCard
            fileName={`${eventSlug}-${channelSlug}-listener.png`}
            label="Listener"
            qrDataUrl={listenerQrDataUrl}
            url={listenerUrl}
          />
          <QRActionCard
            fileName={`${eventSlug}-${channelSlug}-speaker.png`}
            label="Speaker"
            qrDataUrl={speakerQrDataUrl}
            url={speakerUrl}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="us-panel px-6 py-6">
            <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
              {channel.enabled === false ? 'Disabled' : 'Enabled'}
            </span>
            <div className="mt-4">
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
                  {channel.description || 'No channel description has been added yet.'}
                </p>
              </InlineEditField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {channel.languageLabel || channel.languageCode ? (
                <span className="us-chip us-chip-muted">{channel.languageLabel || channel.languageCode}</span>
              ) : null}
              {channel.webrtcEnabled === false ? <span className="us-chip us-chip-warning">WebRTC off</span> : null}
              {channel.hlsEnabled ? <span className="us-chip us-chip-blue">HLS enabled</span> : null}
              {channel.icecastFallbackUrl ? <span className="us-chip us-chip-blue">Fallback configured</span> : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/events/${eventSlug}`}
                className="us-button-secondary px-4 py-2.5 text-sm font-medium"
              >
                Back to event
              </Link>
              <Link href={`/events/${eventSlug}/settings`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Event settings
              </Link>
              <Link href={`/events/${eventSlug}/channels/${channelSlug}/edit`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Advanced settings
              </Link>
            </div>
          </article>

          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Channel routes and room
            </p>
            <dl className="mt-4 grid gap-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              <div>
                <dt className="font-semibold">LiveKit room</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  {channel.livekitRoomName || channel.roomName || `undersound_${eventSlug}_${channelSlug}`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Listener page</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  /listen/{eventSlug}/{channelSlug}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Speaker page</dt>
                <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                  /speak/{eventSlug}/{channelSlug}
                </dd>
              </div>
              {channel.icecastFallbackUrl ? (
                <div>
                  <dt className="font-semibold">Fallback stream</dt>
                  <dd className="break-all" style={{ color: 'var(--us-muted)' }}>
                    {channel.icecastFallbackUrl}
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>

          <article className="us-panel px-6 py-6 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Dangerous actions
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Deleting this channel removes its speaker/listener links and QR targets.
            </p>
            <form action={deleteChannelAction} className="mt-4">
              <input name="eventSlug" type="hidden" value={eventSlug} />
              <input name="id" type="hidden" value={channel.id} />
              <ConfirmSubmitButton confirmMessage="Delete this channel? This removes its listener/speaker links and QR targets.">
                Delete channel
              </ConfirmSubmitButton>
            </form>
          </article>
        </div>
      </section>
    </Layout>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Layout } from '@/components/Layout'
import { QRDrawer } from '@/components/QRDrawer'
import { getDashboardChannel } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateQrDataUrl } from '@/lib/qrcode'
import { deleteChannelAction } from '@/app/events/[eventSlug]/channels/actions'

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
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <article className="us-panel px-6 py-6">
            <span className={`us-chip ${channel.enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
              {channel.enabled === false ? 'Disabled' : 'Enabled'}
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {channel.name}
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              {channel.description || 'No channel description has been added yet.'}
            </p>
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
                href={`/events/${eventSlug}/channels`}
                className="us-button-secondary px-4 py-2.5 text-sm font-medium"
              >
                Back to channels
              </Link>
              <Link href={`/events/${eventSlug}/settings`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Event settings
              </Link>
              <Link href={`/events/${eventSlug}/channels/${channelSlug}/edit`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                Edit channel
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

          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Dangerous actions
            </p>
            <form action={deleteChannelAction} className="mt-4">
              <input name="eventSlug" type="hidden" value={eventSlug} />
              <input name="id" type="hidden" value={channel.id} />
              <button type="submit" className="rounded-2xl border px-4 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
                Delete channel
              </button>
            </form>
          </article>
        </div>

        <div className="space-y-4">
          <QRDrawer
            fileName={`${eventSlug}-${channelSlug}-listener.png`}
            label="Listener QR"
            qrDataUrl={listenerQrDataUrl}
            url={listenerUrl}
          />
          <QRDrawer
            fileName={`${eventSlug}-${channelSlug}-speaker.png`}
            label="Speaker QR"
            qrDataUrl={speakerQrDataUrl}
            url={speakerUrl}
          />
        </div>
      </section>
    </Layout>
  )
}

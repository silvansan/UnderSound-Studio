import { cookies } from 'next/headers'

import { Layout } from '@/components/Layout'
import { QRDrawer } from '@/components/QRDrawer'
import { SpeakerAccessPanel } from '@/components/SpeakerAccessPanel'
import { SpeakerListenerMonitor } from '@/components/SpeakerListenerMonitor'
import { getListenerUrl, getRequestBaseUrl } from '@/lib/links'
import { getPublicChannelContext, isSpeakerPubliclyAvailable } from '@/lib/public-channel'
import { generateQrDataUrl } from '@/lib/qrcode'
import {
  getSpeakerSessionCookieName,
  speakerPasswordRequired,
  verifySpeakerSessionToken,
} from '@/lib/speaker-password'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export default async function SpeakPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const speakerAvailable = context ? isSpeakerPubliclyAvailable(context) : true
  const passwordRequired = context ? speakerPasswordRequired(context) : false
  const speakerCookies = await cookies()
  const sessionCookie = speakerCookies.get(getSpeakerSessionCookieName(eventSlug, channelSlug))?.value
  const hasSpeakerSession =
    !passwordRequired || verifySpeakerSessionToken(eventSlug, channelSlug, sessionCookie)
  const eventTitle = context?.event.title ?? eventSlug
  const channelName = context?.channel.name ?? channelSlug
  const publicBaseUrl = await getRequestBaseUrl()
  const listenerUrl = getListenerUrl(eventSlug, channelSlug, publicBaseUrl)
  const listenerQrDataUrl = await generateQrDataUrl(listenerUrl)

  return (
    <Layout requireAuth={false} title="Speak">
      <section className="mx-auto max-w-4xl space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="us-panel px-6 py-7">
            <span className={`us-chip ${speakerAvailable ? 'us-chip-muted' : 'us-chip-warning'}`}>
              {speakerAvailable ? 'Protected speaker route' : 'Speaker route unavailable'}
            </span>
            <p className="mt-5 text-sm" style={{ color: 'var(--us-muted)' }}>
              {eventTitle} / {channelName}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Publish audio to this channel
            </h2>
            <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: 'var(--us-muted)' }}>
              Speaker passwords unlock this page only; they do not log the speaker into Payload admin. The actual publish
              token still comes from the server-side LiveKit endpoint.
            </p>

            {context ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                  Listener check
                </p>
                <SpeakerListenerMonitor
                  channelName={channelName}
                  channelSlug={channelSlug}
                  eventSlug={eventSlug}
                  fallbackUrl={context.channel.icecastFallbackUrl}
                  listenerPasswordEnabled={context.event.listenerPasswordEnabled}
                  listenerTokenMode={context.channel.listenerTokenMode}
                  webrtcEnabled={context.channel.webrtcEnabled}
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <QRDrawer
                    fileName={`${eventSlug}-${channelSlug}-listener.png`}
                    label="Listener QR"
                    qrDataUrl={listenerQrDataUrl}
                    url={listenerUrl}
                  />
                  <a
                    href={listenerUrl}
                    className="us-button-secondary flex items-center justify-center px-5 py-3 text-sm font-medium"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open listener page
                  </a>
                </div>
              </div>
            ) : null}
          </article>

          {speakerAvailable ? (
            <SpeakerAccessPanel
              channelSlug={channelSlug}
              eventSlug={eventSlug}
              hasAccess={hasSpeakerSession}
              passwordRequired={passwordRequired}
            />
          ) : (
            <article className="us-panel px-6 py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                Not available
              </p>
              <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                This speaker route is disabled or the event is not active.
              </p>
            </article>
          )}
        </div>
      </section>
    </Layout>
  )
}

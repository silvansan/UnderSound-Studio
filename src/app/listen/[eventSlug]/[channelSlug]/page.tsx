import { Layout } from '@/components/Layout'
import { ListenerConnectPanel } from '@/components/ListenerConnectPanel'
import { getPublicChannelContext, isListenerPubliclyAvailable } from '@/lib/public-channel'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export default async function ListenPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const listenerAvailable = context ? isListenerPubliclyAvailable(context) : true
  const eventTitle = context?.event.title ?? eventSlug
  const channelName = context?.channel.name ?? channelSlug
  const languageLabel = context?.channel.languageLabel ?? context?.channel.languageCode ?? context?.event.defaultLanguage

  return (
    <Layout title="Listen">
      <section className="mx-auto max-w-2xl">
        <div className="us-panel us-hero-glow relative overflow-hidden px-6 py-8 text-center md:px-8">
          <div className="relative z-10">
            <span className={`us-chip ${listenerAvailable ? 'us-chip-blue' : 'us-chip-warning'}`}>
              {listenerAvailable ? 'Public listener route' : 'Listener route unavailable'}
            </span>
            <p className="mt-5 text-sm" style={{ color: 'var(--us-muted)' }}>
              {eventTitle} / {channelName}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Connect to the live channel
            </h2>
            {languageLabel ? (
              <p className="mt-2 text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
                Language: {languageLabel}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: 'var(--us-muted)' }}>
              Listener pages stay mobile-first and public-safe. WebRTC is the primary path, with fallback audio shown
              only when the channel has one configured.
            </p>
            {listenerAvailable ? (
              <ListenerConnectPanel
                channelName={channelName}
                channelSlug={channelSlug}
                eventSlug={eventSlug}
                fallbackUrl={context?.channel.icecastFallbackUrl}
                listenerPasswordEnabled={context?.event.listenerPasswordEnabled}
                listenerTokenMode={context?.channel.listenerTokenMode}
                webrtcEnabled={context?.channel.webrtcEnabled}
              />
            ) : (
              <p className="mt-6 rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
                This listener channel is disabled or the event is not active.
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}

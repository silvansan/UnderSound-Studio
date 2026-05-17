import type { Metadata } from 'next'

import { Layout } from '@/components/Layout'
import { ListenerConnectPanel } from '@/components/ListenerConnectPanel'
import { getPublicChannelContext, isListenerPubliclyAvailable } from '@/lib/public-channel'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const eventTitle = context?.event.title ?? eventSlug
  const channelName = context?.channel.name ?? channelSlug

  return {
    title: `Listen | ${eventTitle} / ${channelName}`,
  }
}

export default async function ListenPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const listenerAvailable = context ? isListenerPubliclyAvailable(context) : true
  const eventTitle = context?.event.title ?? eventSlug
  const channelName = context?.channel.name ?? channelSlug
  const languageLabel = context?.channel.languageLabel ?? context?.channel.languageCode ?? context?.event.defaultLanguage

  return (
    <Layout hideHeader requireAuth={false} title="Listen">
      <section className="mx-auto max-w-2xl">
        <div className="us-panel us-hero-glow relative overflow-hidden px-6 py-8 text-center md:px-8">
          <div className="relative z-10">
            <span className={`us-chip ${listenerAvailable ? 'us-chip-blue' : 'us-chip-warning'}`}>
              {listenerAvailable ? 'Public listener route' : 'Listener route unavailable'}
            </span>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--us-blue-dark)' }}>
                {eventTitle}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
                {channelName}
              </h2>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Connect to the live channel
            </h3>
            {languageLabel ? (
              <p className="mt-2 text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
                Language: {languageLabel}
              </p>
            ) : null}
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

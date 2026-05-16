import { Layout } from '@/components/Layout'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export default async function ListenPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params

  return (
    <Layout title="Listen">
      <div className="space-y-4 text-center">
        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
          {eventSlug} / {channelSlug}
        </p>
        <button
          type="button"
          className="w-full max-w-sm rounded-xl px-6 py-4 text-lg font-semibold text-white"
          style={{ backgroundColor: 'var(--us-green)' }}
        >
          Connect
        </button>
        <p className="text-xs" style={{ color: 'var(--us-muted)' }}>
          WebRTC listener flow and LiveKit token API — Phase 7 & 9
        </p>
      </div>
    </Layout>
  )
}

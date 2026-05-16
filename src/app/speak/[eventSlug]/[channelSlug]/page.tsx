import { Layout } from '@/components/Layout'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export default async function SpeakPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params

  return (
    <Layout title="Speak">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
          {eventSlug} / {channelSlug}
        </p>
        <p style={{ color: 'var(--us-muted)' }}>
          Speaker password gate and publish controls — Phase 8
        </p>
      </div>
    </Layout>
  )
}

import { Layout } from '@/components/Layout'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventSlug } = await params

  return (
    <Layout title={eventSlug}>
      <p style={{ color: 'var(--us-muted)' }}>
        Event detail for <strong>{eventSlug}</strong> — channels and QR drawers coming in later phases.
      </p>
    </Layout>
  )
}

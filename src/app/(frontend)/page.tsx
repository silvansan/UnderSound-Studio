import Link from 'next/link'
import { Layout } from '@/components/Layout'

export default function HomePage() {
  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--us-green-dark)' }}>
          UnderSound v2
        </h1>
        <p style={{ color: 'var(--us-muted)' }}>
          Event-based live translation and audio. Payload CMS admin, public listener and speaker routes,
          LiveKit tokens, and Docker-ready deployment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl px-5 py-3 font-medium text-white"
            style={{ backgroundColor: 'var(--us-green)' }}
          >
            Admin panel
          </Link>
          <Link
            href="/events"
            className="rounded-xl px-5 py-3 font-medium"
            style={{ backgroundColor: 'var(--us-card)', color: 'var(--us-blue-dark)' }}
          >
            Events
          </Link>
        </div>
      </section>
    </Layout>
  )
}

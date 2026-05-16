import Link from 'next/link'
import { Layout } from '@/components/Layout'

export default function DashboardPage() {
  return (
    <Layout title="Dashboard">
      <p style={{ color: 'var(--us-muted)' }}>
        Admin dashboard UI will be built in Phase 10. Use the Payload admin at{' '}
        <Link href="/admin" className="underline" style={{ color: 'var(--us-green)' }}>
          /admin
        </Link>{' '}
        for now.
      </p>
    </Layout>
  )
}

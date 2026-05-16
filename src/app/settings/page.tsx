import Link from 'next/link'

import { Layout } from '@/components/Layout'

export default function SettingsPage() {
  return (
    <Layout title="Settings">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted">Site settings</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Global settings route
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Phase 5 gives global settings a stable URL. Payload remains the source of truth for editable site settings,
            while this page can become a branded admin surface in a later dashboard phase.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/globals/site-settings" className="us-button-primary px-4 py-2.5 text-sm font-medium">
              Open Payload settings
            </Link>
            <Link href="/dashboard" className="us-button-secondary px-4 py-2.5 text-sm font-medium">
              Back to dashboard
            </Link>
          </div>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Covered by SiteSettings
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            <li>Public base URL and support email</li>
            <li>Default listener and token behavior</li>
            <li>LiveKit public URL and QR style defaults</li>
            <li>Default UnderSound theme colors</li>
          </ul>
        </article>
      </section>
    </Layout>
  )
}

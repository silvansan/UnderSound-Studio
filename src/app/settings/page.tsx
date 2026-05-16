import Link from 'next/link'

import { importConfigAction } from '@/app/settings/actions'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAppUser()
  const canTransferConfig = isAdminUser(user)
  const showPayloadAdmin = isSuperAdminUser(user)

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
            {showPayloadAdmin ? (
              <Link href="/admin/globals/site-settings" className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Open Payload settings
              </Link>
            ) : null}
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

        {canTransferConfig ? (
          <article className="us-panel px-6 py-6 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Config import / export
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Export or import event/channel configuration as JSON. Speaker/listener password values are exported only as
              stored hashes. User password hashes and secrets are never exported.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=events">
                Export events
              </Link>
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=channels">
                Export channels
              </Link>
              {showPayloadAdmin ? (
                <Link className="us-button-primary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=full">
                  Export full config
                </Link>
              ) : null}
            </div>

            <form action={importConfigAction} className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Import scope
                <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="scope" style={{ borderColor: 'var(--us-border)' }}>
                  <option value="events">Events</option>
                  <option value="channels">Channels</option>
                  {showPayloadAdmin ? <option value="full">Full config</option> : null}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Config JSON
                <input accept="application/json,.json" className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="configFile" required style={{ borderColor: 'var(--us-border)' }} type="file" />
              </label>
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Import config
              </button>
            </form>
          </article>
        ) : null}
      </section>
    </Layout>
  )
}

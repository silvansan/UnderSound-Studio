import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importConfigAction, updateSiteSettingsAction } from '@/app/settings/actions'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAppUser()
  const canTransferConfig = isAdminUser(user)
  const showPayloadAdmin = isSuperAdminUser(user)
  const payload = showPayloadAdmin ? await getPayload({ config: configPromise }) : null
  const settings = payload
    ? await payload.findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
      })
    : null

  return (
    <Layout title="Settings">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {showPayloadAdmin && settings ? (
          <form action={updateSiteSettingsAction} className="us-panel space-y-5 px-6 py-6">
            <div>
              <span className="us-chip us-chip-muted">Site settings</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                App-wide settings
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                These values control public URLs, default listener behavior, token lifetime, and the LiveKit URL shown to
                browser/mobile clients.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Site name
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.siteName ?? 'UnderSound'}
                  name="siteName"
                  style={{ borderColor: 'var(--us-border)' }}
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Support email
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.supportEmail ?? ''}
                  name="supportEmail"
                  placeholder="support@example.com"
                  style={{ borderColor: 'var(--us-border)' }}
                  type="email"
                />
              </label>
            </div>

            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Public base URL
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={settings.publicBaseUrl ?? ''}
                name="publicBaseUrl"
                placeholder="https://studio.example.com"
                style={{ borderColor: 'var(--us-border)' }}
                type="url"
              />
            </label>

            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              LiveKit public URL
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={settings.livekitPublicUrl ?? ''}
                name="livekitPublicUrl"
                placeholder="wss://livekit.example.com"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Default token expiry, seconds
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.defaultTokenExpiry ?? 3600}
                  min={300}
                  name="defaultTokenExpiry"
                  style={{ borderColor: 'var(--us-border)' }}
                  type="number"
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Default QR style
                <select
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.defaultQrStyle ?? 'undersound-default'}
                  name="defaultQrStyle"
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <option value="undersound-default">UnderSound Default</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}>
                <input defaultChecked={settings.allowPublicListenerPages ?? true} name="allowPublicListenerPages" type="checkbox" />
                Allow public listener pages
              </label>

              <label className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}>
                <input defaultChecked={settings.requireEmailVerification ?? true} name="requireEmailVerification" type="checkbox" />
                Require email verification
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Save settings
              </button>
              <Link href="/admin/globals/site-settings" className="us-button-secondary px-4 py-3 text-sm font-medium">
                Advanced Payload settings
              </Link>
            </div>
          </form>
        ) : (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Site settings</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Settings access
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Global site settings are managed by super admins. Admins can still use config import/export for the
              events and channels they can manage.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex us-button-secondary px-4 py-2.5 text-sm font-medium">
              Back to dashboard
            </Link>
          </article>
        )}

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Deployment shortcuts
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            <li>Set app URL with `NEXT_PUBLIC_APP_URL` and `PUBLIC_BASE_URL`.</li>
            <li>Set browser LiveKit URL with `LIVEKIT_URL` or the LiveKit public URL field.</li>
            <li>Use `PORTAINER_EASY_STACK_DEPLOYMENT.md` for proxy and port forwarding notes.</li>
            <li>QR codes follow the host used to open the dashboard.</li>
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

import Link from 'next/link'
import { Layout } from '@/components/Layout'

export default function HomePage() {
  return (
    <Layout>
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="us-panel us-hero-glow relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
          <div className="relative z-10 max-w-2xl">
            <span className="us-chip us-chip-blue">Phase 1 branding in progress</span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
              Live translation and event audio, rebuilt on a calmer foundation.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 md:text-lg" style={{ color: 'var(--us-muted)' }}>
              UnderSound v2 keeps the public listener and speaker links simple while giving admins a cleaner
              Payload-based control surface behind the scenes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin" className="us-button-primary px-5 py-3 font-medium">
                Open admin panel
              </Link>
              <Link href="/events" className="us-button-secondary px-5 py-3 font-medium">
                Browse event routes
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="us-panel px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Stack
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              <li>Payload CMS 3 with Next.js App Router</li>
              <li>Server-side LiveKit token flow</li>
              <li>Docker and Portainer-friendly deployment</li>
            </ul>
          </div>

          <div className="us-panel px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Compatibility goals
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              <li>Existing Android listener links</li>
              <li>Existing QR listener structure</li>
              <li>Stable speaker and listener public routes</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  )
}

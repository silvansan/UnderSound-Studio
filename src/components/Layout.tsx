import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'

type LayoutProps = {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="us-panel overflow-hidden lg:w-[290px] lg:flex-none">
          <div
            className="us-hero-glow relative flex h-full flex-col gap-8 px-5 py-6"
            style={{
              background:
                'linear-gradient(180deg, rgba(22, 63, 53, 0.98) 0%, rgba(18, 107, 182, 0.94) 100%)',
            }}
          >
            <div className="relative z-10">
              <Logo theme="light" />
            </div>

            <nav className="relative z-10 space-y-2">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/events', label: 'Events' },
                { href: '/settings', label: 'Settings' },
                { href: '/admin', label: 'Admin' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border px-4 py-3 text-sm font-medium text-white/92"
                  style={{ borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div
              className="relative z-10 mt-auto rounded-2xl border px-4 py-4"
              style={{ borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Current focus</p>
              <p className="mt-2 text-sm leading-6 text-white/92">
                Payload-powered event audio with clean public listener and speaker flows.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="us-panel px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                  UnderSound v2
                </p>
                {title ? (
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                    {title}
                  </h1>
                ) : (
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                    Event audio control
                  </h1>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/events" className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                  Browse events
                </Link>
                <Link href="/settings" className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                  Settings
                </Link>
                <Link href="/admin" className="us-button-primary px-4 py-2.5 text-sm font-medium">
                  Open admin
                </Link>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

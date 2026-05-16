import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'
import { getCurrentAppUser, requireAppUser } from '@/lib/app-auth'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

type LayoutProps = {
  children: ReactNode
  requireAuth?: boolean
  title?: string
}

export async function Layout({ children, requireAuth = true, title }: LayoutProps) {
  const user = requireAuth ? await requireAppUser() : await getCurrentAppUser()
  const showAppMenu = Boolean(user)
  const showPayloadAdmin = user ? isSuperAdminUser(user) : false
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', show: true },
    { href: '/events', label: 'Events', show: true },
    { href: '/channels', label: 'Channels', show: true },
    { href: '/users', label: 'Users', show: user ? isAdminUser(user) : false },
    { href: '/settings', label: 'Settings', show: true },
    { href: '/admin', label: 'Payload Admin', show: showPayloadAdmin },
  ].filter((item) => item.show)

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 xl:flex-row">
        {showAppMenu ? (
          <aside className="us-panel overflow-hidden xl:w-[290px] xl:flex-none">
            <div
              className="us-hero-glow relative flex h-full flex-col gap-5 px-5 py-5 xl:gap-8 xl:py-6"
              style={{
                background:
                  'linear-gradient(180deg, rgba(22, 63, 53, 0.98) 0%, rgba(18, 107, 182, 0.94) 100%)',
              }}
            >
              <div className="relative z-10">
                <Logo theme="light" />
              </div>

              <nav className="relative z-10 flex flex-wrap gap-2 xl:block xl:space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="min-w-[120px] flex-1 rounded-2xl border px-4 py-3 text-sm font-medium text-white/92 xl:block xl:w-full"
                    style={{ borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div
                className="relative z-10 mt-auto hidden rounded-2xl border px-4 py-4 xl:block"
                style={{ borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Current focus</p>
                <p className="mt-2 text-sm leading-6 text-white/92">
                  Payload-powered event audio with clean public listener and speaker flows.
                </p>
              </div>
            </div>
          </aside>
        ) : null}

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
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

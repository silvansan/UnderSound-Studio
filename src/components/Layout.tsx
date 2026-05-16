import type { ReactNode } from 'react'
import { Logo } from './Logo'

type LayoutProps = {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--us-bg)' }}>
      <header
        className="border-b px-4 py-3"
        style={{ borderColor: 'var(--us-green-light)', backgroundColor: 'var(--us-card)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Logo />
          {title ? (
            <span className="text-sm" style={{ color: 'var(--us-muted)' }}>
              {title}
            </span>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

import Link from 'next/link'
import { APP_PRONUNCIATION, APP_STUDIO_NAME } from '@/lib/branding'
import { LogoImage } from './LogoImage'

type LogoProps = {
  className?: string
  theme?: 'default' | 'light'
}

export function Logo({ className = '', theme = 'default' }: LogoProps) {
  const titleColor = theme === 'light' ? 'white' : 'var(--us-green-dark)'
  const subtitleColor = theme === 'light' ? 'rgba(255,255,255,0.78)' : 'var(--us-blue-dark)'

  return (
    <Link href="/" className={`inline-flex items-center gap-3 font-semibold ${className}`}>
      <span
        className="overflow-hidden rounded-2xl border border-white/40 shadow-lg"
        style={{ boxShadow: '0 10px 30px rgba(18, 107, 182, 0.14)' }}
      >
        <LogoImage />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight" style={{ color: titleColor }}>
          {APP_STUDIO_NAME}
        </span>
        <span className="block text-xs font-medium uppercase tracking-[0.16em]" style={{ color: subtitleColor }}>
          {APP_PRONUNCIATION}
        </span>
      </span>
    </Link>
  )
}

import Link from 'next/link'
import Image from 'next/image'

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
        <Image
          src="/undersound-logo.png"
          alt="UnderSound logo"
          width={54}
          height={54}
          priority
          className="h-[54px] w-[54px] object-cover"
        />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight" style={{ color: titleColor }}>
          UnderSound
        </span>
        <span className="block text-xs font-medium uppercase tracking-[0.16em]" style={{ color: subtitleColor }}>
          Live Audio Studio
        </span>
      </span>
    </Link>
  )
}

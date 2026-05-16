import Link from 'next/link'

type LogoProps = {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: 'var(--us-green)' }}
        aria-hidden
      >
        US
      </span>
      <span style={{ color: 'var(--us-green-dark)' }}>UnderSound</span>
    </Link>
  )
}

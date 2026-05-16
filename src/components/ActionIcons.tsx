import Link from 'next/link'

type IconProps = {
  className?: string
}

export function QRCodeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2v-2Zm4 0h1v5h-5v-1h4v-4Zm-5 4h2v1h-2v-1Z" fill="currentColor" />
      <path d="M6.5 6.5h1v1h-1v-1Zm10 0h1v1h-1v-1Zm-10 10h1v1h-1v-1Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function OpenLinkIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M14 5h5v5m-.5-4.5L11 13m-2-6H6.5A2.5 2.5 0 0 0 4 9.5v8A2.5 2.5 0 0 0 6.5 20h8a2.5 2.5 0 0 0 2.5-2.5V15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function PlusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function MinusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function IconActionLink({
  children,
  href,
  icon,
  target,
}: {
  children: string
  href: string
  icon: 'open' | 'qr'
  target?: '_blank'
}) {
  const Icon = icon === 'qr' ? QRCodeIcon : OpenLinkIcon

  const className =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md'
  const style = { borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }

  if (target === '_blank') {
    return (
      <a aria-label={children} className={className} href={href} rel="noreferrer" style={style} target="_blank" title={children}>
        <Icon />
      </a>
    )
  }

  return (
    <Link aria-label={children} className={className} href={href} style={style} title={children}>
      <Icon />
    </Link>
  )
}

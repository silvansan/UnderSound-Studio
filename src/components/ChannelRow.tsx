'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { IconActionLink } from '@/components/ActionIcons'
import { QRPopup } from '@/components/QRPopup'

type ChannelRowProps = {
  description?: string | null
  enabled?: boolean | null
  eventSlug: string
  languageLabel?: string | null
  listenerPageEnabled?: boolean | null
  listenerQrDataUrl?: string
  listenerUrl: string
  name: string
  slug: string
  speakerPageEnabled?: boolean | null
  speakerQrDataUrl?: string
  speakerUrl: string
}

export function ChannelRow({
  description,
  enabled,
  eventSlug,
  languageLabel,
  listenerPageEnabled,
  listenerQrDataUrl,
  listenerUrl,
  name,
  slug,
  speakerPageEnabled,
  speakerQrDataUrl,
  speakerUrl,
}: ChannelRowProps) {
  const router = useRouter()
  const href = `/events/${eventSlug}/channels/${slug}`

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className="grid cursor-pointer gap-3 rounded-2xl border bg-white/75 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1.1fr_1fr_1.2fr_1.2fr_100px] lg:items-center"
      onClick={openRow}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openRow()
        }
      }}
      role="link"
      style={{ borderColor: 'var(--us-border)' }}
      tabIndex={0}
    >
      <div>
        <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {name}
        </span>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {languageLabel ? <span className="us-chip us-chip-muted">{languageLabel}</span> : null}
        <span className={`us-chip ${enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
          {enabled === false ? 'Disabled' : 'Enabled'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
          Speaker
        </span>
        {speakerQrDataUrl ? (
          <QRPopup fileName={`${eventSlug}-${slug}-speaker.png`} label={`${name} speaker`} qrDataUrl={speakerQrDataUrl} triggerLabel="Show speaker QR" url={speakerUrl} />
        ) : null}
        <IconActionLink href={speakerUrl} icon="open" target="_blank">
          Open speaker page
        </IconActionLink>
        {speakerPageEnabled === false ? <span className="us-chip us-chip-warning">Off</span> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
          Listener
        </span>
        {listenerQrDataUrl ? (
          <QRPopup fileName={`${eventSlug}-${slug}-listener.png`} label={`${name} listener`} qrDataUrl={listenerQrDataUrl} triggerLabel="Show listener QR" url={listenerUrl} />
        ) : null}
        <IconActionLink href={listenerUrl} icon="open" target="_blank">
          Open listener page
        </IconActionLink>
        {listenerPageEnabled === false ? <span className="us-chip us-chip-warning">Off</span> : null}
      </div>

      <Link href={href} className="us-button-secondary justify-self-start px-3 py-2 text-sm font-medium lg:justify-self-end" onClick={(event) => event.stopPropagation()}>
        Manage
      </Link>
    </li>
  )
}

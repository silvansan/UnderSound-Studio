import Link from 'next/link'

type ChannelCardProps = {
  description?: string | null
  eventSlug: string
  name: string
  slug: string
  languageLabel?: string | null
  enabled?: boolean
  listenerPageEnabled?: boolean | null
  speakerPageEnabled?: boolean | null
}

export function ChannelCard({
  description,
  enabled,
  eventSlug,
  languageLabel,
  listenerPageEnabled,
  name,
  slug,
  speakerPageEnabled,
}: ChannelCardProps) {
  return (
    <article
      className="us-panel p-4"
    >
      <h3 className="font-medium" style={{ color: 'var(--us-blue-dark)' }}>
        {name}
      </h3>
      {languageLabel ? (
        <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
          {languageLabel}
        </p>
      ) : null}
      {description ? (
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          {description}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`us-chip ${enabled === false ? 'us-chip-warning' : 'us-chip-blue'}`}>
          {enabled === false ? 'Disabled' : 'Enabled'}
        </span>
        {listenerPageEnabled === false ? <span className="us-chip us-chip-warning">Listener off</span> : null}
        {speakerPageEnabled === false ? <span className="us-chip us-chip-warning">Speaker off</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/events/${eventSlug}/channels/${slug}`}
          className="us-button-primary px-3 py-2 text-sm font-medium"
        >
          Manage
        </Link>
        <Link
          href={`/listen/${eventSlug}/${slug}`}
          className="us-button-secondary px-3 py-2 text-sm font-medium"
        >
          Listen
        </Link>
      </div>
    </article>
  )
}

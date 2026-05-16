import Link from 'next/link'

type ChannelCardProps = {
  eventSlug: string
  name: string
  slug: string
  languageLabel?: string | null
  enabled?: boolean
}

export function ChannelCard({ eventSlug, name, slug, languageLabel, enabled }: ChannelCardProps) {
  return (
    <article
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--us-card)', borderColor: 'var(--us-blue)' }}
    >
      <h3 className="font-medium" style={{ color: 'var(--us-blue-dark)' }}>
        {name}
      </h3>
      {languageLabel ? (
        <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
          {languageLabel}
        </p>
      ) : null}
      <p className="mt-1 text-xs" style={{ color: 'var(--us-muted)' }}>
        {enabled === false ? 'Disabled' : 'Enabled'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/events/${eventSlug}/channels/${slug}`}
          className="rounded-lg px-3 py-1.5 text-sm text-white"
          style={{ backgroundColor: 'var(--us-blue-dark)' }}
        >
          Manage
        </Link>
        <Link
          href={`/listen/${eventSlug}/${slug}`}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{ backgroundColor: 'var(--us-bg)' }}
        >
          Listen
        </Link>
      </div>
    </article>
  )
}

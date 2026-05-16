import Link from 'next/link'

type EventCardProps = {
  title: string
  slug: string
  status?: string
  description?: string | null
}

export function EventCard({ title, slug, status, description }: EventCardProps) {
  return (
    <article
      className="rounded-xl border p-5 shadow-sm transition hover:shadow-md"
      style={{ backgroundColor: 'var(--us-card)', borderColor: 'var(--us-green-light)' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {title}
        </h2>
        {status ? (
          <span className="rounded-full px-2 py-0.5 text-xs capitalize" style={{ backgroundColor: 'var(--us-bg)' }}>
            {status}
          </span>
        ) : null}
      </div>
      {description ? <p className="mb-4 text-sm" style={{ color: 'var(--us-muted)' }}>{description}</p> : null}
      <Link
        href={`/events/${slug}`}
        className="inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--us-green)' }}
      >
        Open event
      </Link>
    </article>
  )
}

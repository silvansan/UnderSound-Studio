import Link from 'next/link'

type EventCardProps = {
  channelCount?: number
  dateStart?: string | null
  title: string
  slug: string
  status?: string
  description?: string | null
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EventCard({ channelCount, dateStart, title, slug, status, description }: EventCardProps) {
  const formattedDate = formatDate(dateStart)

  return (
    <article
      className="us-panel p-5"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {title}
        </h2>
        {status ? (
          <span className="us-chip us-chip-muted capitalize">
            {status}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mb-4 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          {description}
        </p>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {typeof channelCount === 'number' ? (
          <span className="us-chip us-chip-blue">
            {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
          </span>
        ) : null}
        {formattedDate ? <span className="us-chip us-chip-muted">{formattedDate}</span> : null}
      </div>
      <Link
        href={`/events/${slug}`}
        className="us-button-primary inline-flex px-4 py-2.5 text-sm font-medium"
      >
        Open event
      </Link>
    </article>
  )
}

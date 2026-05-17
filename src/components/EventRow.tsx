'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type EventRowProps = {
  channelCount: number
  dateStart?: string | null
  description?: string | null
  location?: string | null
  slug: string
  status?: string | null
  title: string
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

export function EventRow({ channelCount, dateStart, description, location, slug, status, title }: EventRowProps) {
  const formattedDate = formatDate(dateStart)
  const router = useRouter()
  const href = `/events/${slug}`

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className="grid cursor-pointer gap-3 rounded-2xl border bg-white/75 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1.3fr_1fr_120px_120px] lg:items-center"
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
          {title}
        </span>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {status ? <span className="us-chip us-chip-muted capitalize">{status}</span> : null}
        <span className="us-chip us-chip-blue">
          {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
        </span>
      </div>

      <div className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        {location || formattedDate || 'No date'}
      </div>

      <Link
        href={href}
        className="us-button-primary justify-self-start px-4 py-2.5 text-sm font-medium lg:justify-self-end"
        onClick={(event) => event.stopPropagation()}
      >
        Open event
      </Link>
    </li>
  )
}

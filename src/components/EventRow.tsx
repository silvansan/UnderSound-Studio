'use client'

import { useRouter } from 'next/navigation'

import { deleteEventAction } from '@/app/events/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'

type EventRowProps = {
  canDelete?: boolean
  channelCount: number
  dateStart?: string | null
  description?: string | null
  eventId: number
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

export function EventRow({
  canDelete = false,
  channelCount,
  dateStart,
  description,
  eventId,
  location,
  slug,
  status,
  title,
}: EventRowProps) {
  const formattedDate = formatDate(dateStart)
  const router = useRouter()
  const href = `/events/${slug}`
  const deleteFormId = `delete-event-${eventId}`

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className="grid cursor-pointer gap-3 rounded-2xl border bg-white/75 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1.3fr_1fr_120px_88px] lg:items-center"
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

      <div className="flex flex-wrap items-center gap-2 lg:justify-end" onClick={(event) => event.stopPropagation()}>
        {canDelete ? (
          <form action={deleteEventAction} id={deleteFormId}>
            <input name="id" type="hidden" value={eventId} />
            <input name="returnTo" type="hidden" value="list" />
            <ConfirmSubmitButton
              action={deleteEventAction}
              className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
              confirmMessage="Delete this event? This also removes its channels and event assignments."
              formId={deleteFormId}
              title="Delete event"
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  )
}

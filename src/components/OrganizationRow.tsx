'use client'

import { useRouter } from 'next/navigation'

import { deleteOrganizationAction } from '@/app/organizations/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type OrganizationRowProps = {
  canDelete?: boolean
  eventCount: number
  memberCount: number
  name: string
  organizationId: number
  rowTint?: ListRowTint
  slug: string
}

export function OrganizationRow({
  canDelete = false,
  eventCount,
  memberCount,
  name,
  organizationId,
  rowTint = 'white',
  slug,
}: OrganizationRowProps) {
  const router = useRouter()
  const href = `/organizations/${slug}`
  const deleteFormId = `delete-organization-${organizationId}`

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className={`us-data-row us-data-row--cols-4 cursor-pointer rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${rowTintClass(rowTint)}`}
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
      <div className="us-data-row__lead">
        <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {name}
        </span>
        <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
          {slug}
        </p>
      </div>

      <div className="us-data-row__chips">
        <span className="us-chip us-chip-blue">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </span>
        <span className="us-chip us-chip-muted">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>

      <div className="us-data-row__detail text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        Open organization
      </div>

      <div className="us-data-row__actions" onClick={(event) => event.stopPropagation()}>
        {canDelete ? (
          <form action={deleteOrganizationAction} id={deleteFormId}>
            <input name="organizationId" type="hidden" value={organizationId} />
            <ConfirmSubmitButton
              action={deleteOrganizationAction}
              className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
              confirmMessage="Delete this organization? This cannot be undone."
              formId={deleteFormId}
              title="Delete organization"
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        ) : eventCount > 0 ? (
          <span className="text-xs" style={{ color: 'var(--us-muted)' }}>
            Has events
          </span>
        ) : null}
      </div>
    </li>
  )
}

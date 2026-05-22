'use client'

import { useRouter } from 'next/navigation'

import { formatGlobalRole, formatOrganizationRole } from '@/lib/organization-user-utils'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type UserHubRowProps = {
  globalRole: string
  organizationName?: string | null
  organizationSlug?: string | null
  roleInOrganization?: string | null
  rowTint?: ListRowTint
  showOrganizationColumn?: boolean
  userEmail: string
  userName: string
}

export function UserHubRow({
  globalRole,
  organizationName,
  organizationSlug,
  roleInOrganization,
  rowTint = 'white',
  showOrganizationColumn = true,
  userEmail,
  userName,
}: UserHubRowProps) {
  const router = useRouter()
  const href = organizationSlug ? `/organizations/${organizationSlug}?tab=users` : null
  const gridClass = showOrganizationColumn ? 'us-data-row--cols-4' : 'us-data-row--cols-3'
  const isInteractive = Boolean(href)

  function openRow() {
    if (href) {
      router.push(href)
    }
  }

  return (
    <li
      className={`us-data-row ${gridClass} rounded-2xl border px-4 py-4 transition ${isInteractive ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''} ${rowTintClass(rowTint)}`}
      onClick={isInteractive ? openRow : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openRow()
              }
            }
          : undefined
      }
      role={isInteractive ? 'link' : undefined}
      style={{ borderColor: 'var(--us-border)' }}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className="us-data-row__lead">
        <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {userName}
        </span>
        <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
          {userEmail}
        </p>
      </div>

      {showOrganizationColumn ? (
        <div className="us-data-row__chips">
          {organizationName ? (
            <span className="us-chip us-chip-blue">{organizationName}</span>
          ) : (
            <span className="us-chip us-chip-muted">No organization</span>
          )}
        </div>
      ) : null}

      <div className={`us-data-row__${showOrganizationColumn ? 'detail' : 'chips'}`}>
        {showOrganizationColumn ? (
          <span className="us-chip us-chip-muted capitalize">{formatOrganizationRole(roleInOrganization)}</span>
        ) : (
          <>
            <span className="us-chip us-chip-muted capitalize">{formatOrganizationRole(roleInOrganization)}</span>
            <span className="us-chip us-chip-blue capitalize">{formatGlobalRole(globalRole)}</span>
          </>
        )}
      </div>

      <div className="us-data-row__actions text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        {organizationSlug ? 'Manage user' : 'Unassigned'}
      </div>
    </li>
  )
}

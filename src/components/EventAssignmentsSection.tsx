import Link from 'next/link'

import { TruncatedList } from '@/components/TruncatedList'
import type { EventAssignment, User } from '@/payload-types'

type EventAssignmentsSectionProps = {
  assignments: EventAssignment[]
  canManageAssignments: boolean
}

function userLabel(user: number | User): string {
  if (typeof user === 'number') {
    return `User ${user}`
  }

  return `${user.name} (${user.email})`
}

function userRole(user: number | User): string {
  return typeof user === 'number' ? 'unknown' : user.role
}

export function EventAssignmentsSection({ assignments, canManageAssignments }: EventAssignmentsSectionProps) {
  if (assignments.length === 0 && !canManageAssignments) {
    return null
  }

  return (
    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Team assignments
        </p>
        {canManageAssignments ? (
          <Link className="text-sm font-medium hover:underline" href="/users" style={{ color: 'var(--us-blue-dark)' }}>
            Manage on Users page
          </Link>
        ) : null}
      </div>

      {assignments.length > 0 ? (
        <TruncatedList className="mt-4" itemLabel="assignments" listClassName="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
              <p className="font-semibold">{userLabel(assignment.user)}</p>
              <p className="mt-1 capitalize" style={{ color: 'var(--us-muted)' }}>
                {assignment.roleForEvent} · user role {userRole(assignment.user)}
              </p>
            </div>
          ))}
        </TruncatedList>
      ) : (
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          No users are assigned yet.{' '}
          {canManageAssignments ? 'Open the Users page to add moderators.' : null}
        </p>
      )}
    </div>
  )
}

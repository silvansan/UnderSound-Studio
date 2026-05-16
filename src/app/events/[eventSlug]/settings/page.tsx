import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { deleteEventAssignmentAction, upsertEventAssignmentAction } from '@/app/events/[eventSlug]/settings/actions'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEvent } from '@/lib/dashboard-data'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { User } from '@/payload-types'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

function userLabel(user: number | User): string {
  if (typeof user === 'number') {
    return `User ${user}`
  }

  return `${user.name} (${user.email})`
}

function userRole(user: number | User): string {
  return typeof user === 'number' ? 'unknown' : user.role
}

export default async function EventSettingsPage({ params }: PageProps) {
  const { eventSlug } = await params
  const user = await requireAppUser()
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })
  const canManageAssignments = isAdminUser(user)
  const [assignments, assignableUsers] = await Promise.all([
    payload.find({
      collection: 'event-assignments',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'roleForEvent',
      user,
      where: {
        event: {
          equals: event.id,
        },
      },
    }),
    canManageAssignments
      ? payload.find({
          collection: 'users',
          depth: 0,
          limit: 200,
          overrideAccess: false,
          pagination: false,
          sort: 'email',
          user,
          where: isSuperAdminUser(user)
            ? undefined
            : {
                role: {
                  equals: 'moderator',
                },
              },
        })
      : Promise.resolve({ docs: [] }),
  ])

  return (
    <Layout title={`${event.title} settings`}>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="us-panel px-6 py-6">
          <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            {event.title}
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            This branded settings page summarizes the current event state. Edit sensitive settings, passwords, and
            dangerous actions in Payload admin.
          </p>
          <dl className="mt-5 grid gap-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
            <div>
              <dt className="font-semibold">Public listeners</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.publicListenerEnabled === false ? 'Disabled' : 'Enabled'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Default language</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.defaultLanguage || 'Not set'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Channels</dt>
              <dd style={{ color: 'var(--us-muted)' }}>{event.channelCount}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/events/${eventSlug}`} className="us-button-secondary px-4 py-2.5 text-sm font-medium">
              Back to event
            </Link>
            {isSuperAdminUser(user) ? (
              <Link href="/admin/collections/events" className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Open events in admin
              </Link>
            ) : null}
          </div>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Event assignments
          </p>
          {assignments.docs.length > 0 ? (
            <div className="mt-4 space-y-3">
              {assignments.docs.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                  <p className="font-semibold">{userLabel(assignment.user)}</p>
                  <p className="mt-1 capitalize" style={{ color: 'var(--us-muted)' }}>
                    {assignment.roleForEvent} assignment · user role {userRole(assignment.user)}
                  </p>
                  {canManageAssignments ? (
                    <form action={deleteEventAssignmentAction} className="mt-3">
                      <input name="assignmentID" type="hidden" value={assignment.id} />
                      <input name="eventSlug" type="hidden" value={eventSlug} />
                      <button type="submit" className="rounded-2xl border px-3 py-2 text-xs font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
                        Remove
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No users are assigned to this event yet.
            </p>
          )}
        </article>

        {canManageAssignments ? (
          <article className="us-panel px-6 py-6 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Add or update assignment
            </p>
            <form action={upsertEventAssignmentAction} className="mt-5 space-y-5">
              <input name="eventID" type="hidden" value={event.id} />
              <input name="eventSlug" type="hidden" value={eventSlug} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                  User
                  <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="userID" required style={{ borderColor: 'var(--us-border)' }}>
                    <option value="">Select user</option>
                    {assignableUsers.docs.map((assignableUser) => (
                      <option key={assignableUser.id} value={assignableUser.id}>
                        {assignableUser.name} ({assignableUser.email}) · {assignableUser.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                  Event role
                  <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="roleForEvent" style={{ borderColor: 'var(--us-border)' }}>
                    {isSuperAdminUser(user) ? <option value="admin">Admin</option> : null}
                    <option value="moderator">Moderator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                {[
                  ['canEditEvent', 'Edit event', false],
                  ['canCreateChannels', 'Create channels', true],
                  ['canDeleteChannels', 'Delete channels', true],
                  ['canViewQR', 'View QR', true],
                  ['canManageSpeakerPassword', 'Manage speaker password', true],
                ].map(([name, label, checked]) => (
                  <label key={String(name)} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                    <input className="mt-1" defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button type="submit" className="us-button-primary px-5 py-3 text-sm font-medium">
                Save assignment
              </button>
            </form>
          </article>
        ) : null}
      </section>
    </Layout>
  )
}

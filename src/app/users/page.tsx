import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'

import { deleteUserAction, inviteUserAction, updateUserAction } from '@/app/users/actions'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { Event, User } from '@/payload-types'

export const dynamic = 'force-dynamic'

function getUserWhere(userID: number | string, role?: string | null): Where | undefined {
  if (role === 'super_admin') {
    return undefined
  }

  if (role === 'admin') {
    return {
      role: {
        not_equals: 'super_admin',
      },
    }
  }

  return {
    id: {
      equals: userID,
    },
  }
}

function eventTitle(event: number | Event): string {
  return typeof event === 'number' ? `Event ${event}` : event.title
}

function getUserEventSummary(userID: number, userEvents: Map<number, string[]>): string {
  const events = userEvents.get(userID) ?? []

  if (events.length === 0) {
    return 'No assigned events'
  }

  if (events.length <= 2) {
    return events.join(', ')
  }

  return `${events.slice(0, 2).join(', ')} ... (${events.length} total)`
}

export default async function UsersPage() {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'email',
    user: currentUser,
    where: getUserWhere(currentUser.id, currentUser.role),
  })
  const assignments = await payload
    .find({
      collection: 'event-assignments',
      depth: 1,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      user: currentUser,
    })
    .catch(() => ({ docs: [] }))
  const userEvents = assignments.docs.reduce((accumulator, assignment) => {
    const assignedUser = typeof assignment.user === 'number' ? assignment.user : assignment.user.id
    const events = accumulator.get(assignedUser) ?? []

    events.push(eventTitle(assignment.event))
    accumulator.set(assignedUser, events)

    return accumulator
  }, new Map<number, string[]>())

  return (
    <Layout title="Users">
      <section className="space-y-4">
        <article className="us-panel px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="us-chip us-chip-blue">App-side user management</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                Users and roles
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                Invite users and manage their basic app access without opening Payload admin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isSuperAdminUser(currentUser) ? (
                <Link href="/admin/collections/users" className="us-button-secondary px-5 py-3 text-sm font-medium">
                  Open Payload users
                </Link>
              ) : null}
            </div>
          </div>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Invite user
          </p>
          <form action={inviteUserAction} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.2fr_220px_auto] lg:items-end">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Username
              <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="name" required style={{ borderColor: 'var(--us-border)' }} />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Email
              <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="email" required style={{ borderColor: 'var(--us-border)' }} type="email" />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Role
              <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="role" style={{ borderColor: 'var(--us-border)' }}>
                {isSuperAdminUser(currentUser) ? <option value="admin">Admin</option> : null}
                <option value="moderator">Moderator</option>
              </select>
            </label>
            <button type="submit" className="us-button-primary px-5 py-3 text-sm font-medium">
              Send invite
            </button>
          </form>
        </article>

        <article className="us-panel overflow-hidden px-4 py-4">
          <div className="hidden grid-cols-[1fr_1.2fr_1.4fr_90px_150px_44px] gap-4 px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
            <span>Username</span>
            <span>Email</span>
            <span>Events</span>
            <span>Active?</span>
            <span>Role</span>
            <span />
          </div>

          <div className="space-y-3">
            {users.docs.map((user: User) => (
              <details key={user.id} className="group rounded-3xl border bg-white/75 px-4 py-4 lg:px-3 lg:py-3" style={{ borderColor: 'var(--us-border)' }}>
                <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-3 lg:grid-cols-[1fr_1.2fr_1.4fr_90px_150px_44px] lg:items-center">
                  <div>
                    <span className="sr-only lg:not-sr-only lg:block lg:text-xs lg:font-semibold lg:uppercase lg:tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
                      Username
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                      {user.name}
                    </span>
                  </div>
                  <span className="us-chip us-chip-muted w-fit justify-self-end lg:justify-self-auto">{user.role?.replace('_', ' ') ?? 'user'}</span>
                  <div className="break-all text-sm lg:col-auto" style={{ color: 'var(--us-muted)' }}>
                    <span className="sr-only lg:not-sr-only lg:block lg:text-xs lg:font-semibold lg:uppercase lg:tracking-[0.12em]">Email</span>
                    {user.email}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--us-muted)' }}>
                    <span className="sr-only lg:not-sr-only lg:block lg:text-xs lg:font-semibold lg:uppercase lg:tracking-[0.12em]">Events</span>
                    {getUserEventSummary(user.id, userEvents)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] lg:sr-only" style={{ color: 'var(--us-muted)' }}>
                      Active?
                    </span>
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-sm ${user.active === false ? 'opacity-35' : ''}`} style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
                      {user.active === false ? '' : '✓'}
                    </span>
                  </div>
                  <span className="justify-self-end text-2xl leading-none transition group-open:rotate-180 lg:justify-self-auto" style={{ color: 'var(--us-blue-dark)' }}>
                    ˅
                  </span>
                </summary>

                <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--us-border)' }}>
                  <form action={updateUserAction} className="grid gap-3 md:grid-cols-2">
                    <input name="id" type="hidden" value={user.id} />
                    <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                      Name
                      <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.name} name="name" required style={{ borderColor: 'var(--us-border)' }} />
                    </label>
                    <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                      Language
                      <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.preferredLanguage ?? 'en'} name="preferredLanguage" style={{ borderColor: 'var(--us-border)' }} />
                    </label>
                    {isSuperAdminUser(currentUser) ? (
                      <>
                        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                          Role
                          <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.role} name="role" style={{ borderColor: 'var(--us-border)' }}>
                            <option value="super_admin">Super admin</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                          <input defaultChecked={user.active !== false} name="active" type="checkbox" />
                          <span>Active</span>
                        </label>
                      </>
                    ) : null}
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button type="submit" className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                        Save user
                      </button>
                    </div>
                  </form>
                  {String(user.id) !== String(currentUser.id) ? (
                    <form action={deleteUserAction} className="mt-3">
                      <input name="id" type="hidden" value={user.id} />
                      <button type="submit" className="rounded-2xl border px-4 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
                        Delete user
                      </button>
                    </form>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </article>
      </section>
    </Layout>
  )
}

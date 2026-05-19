import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload, type Where } from 'payload'

import {
  approveMembershipAction,
  deleteUserAction,
  rejectMembershipAction,
  removeMembershipAction,
  resendInviteForUserAction,
  sendPasswordResetForUserAction,
  updateUserAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { UserEventAssignmentsSection } from '@/components/UserEventAssignmentsSection'
import { Layout } from '@/components/Layout'
import { InviteUserPanel } from '@/components/InviteUserPanel'
import { TruncatedList } from '@/components/TruncatedList'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEvents } from '@/lib/dashboard-data'
import { getManageableOrganizationIDs } from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { Event, EventAssignment, OrganizationMembership, User } from '@/payload-types'

export const metadata = pageMetadata('Users')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ organization?: string }>
}

function userID(user: number | User): number {
  return typeof user === 'number' ? user : user.id
}

function userLabel(user: number | User): string {
  return typeof user === 'number' ? `User ${user}` : user.name
}

function eventTitle(event: number | Event): string {
  return typeof event === 'number' ? `Event ${event}` : event.title
}

function getUserEventSummary(userId: number, userEvents: Map<number, string[]>): string {
  const events = userEvents.get(userId) ?? []

  if (events.length === 0) {
    return 'No assigned events'
  }

  if (events.length <= 2) {
    return events.join(', ')
  }

  return `${events.slice(0, 2).join(', ')} ... (${events.length} total)`
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    notFound()
  }

  const { organization: organizationSlug } = await searchParams
  const payload = await getPayload({ config: configPromise })
  const assignableEvents = await getDashboardEvents(500)
  const manageableOrganizationIDs = isSuperAdminUser(currentUser)
    ? null
    : await getManageableOrganizationIDs({ payload, user: currentUser } as never)

  const organizationWhere: Where | undefined =
    manageableOrganizationIDs === null
      ? undefined
      : manageableOrganizationIDs.length > 0
        ? {
            id: {
              in: manageableOrganizationIDs,
            },
          }
        : {
            id: {
              equals: -1,
            },
          }

  const organizations = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'name',
    user: currentUser,
    where: organizationWhere,
  })

  if (
    organizationSlug &&
    organizations.docs.length > 0 &&
    !organizations.docs.some((organization) => organization.slug === organizationSlug)
  ) {
    redirect('/users')
  }

  const selectedOrganization =
    organizations.docs.find((organization) => organization.slug === organizationSlug) ?? organizations.docs[0] ?? null

  const memberships = selectedOrganization
    ? await payload.find({
        collection: 'organization-memberships',
        depth: 1,
        limit: 500,
        overrideAccess: false,
        pagination: false,
        user: currentUser,
        where: {
          organization: {
            equals: selectedOrganization.id,
          },
        },
      })
    : { docs: [] as OrganizationMembership[] }

  const pendingInvites = memberships.docs.filter(
    (membership) => membership.status === 'pending' && membership.invitedBy && !membership.requestedBy,
  )
  const pendingRequests = memberships.docs.filter(
    (membership) => membership.status === 'pending' && membership.requestedBy,
  )
  const activeMemberships = memberships.docs.filter((membership) => membership.status === 'active')
  const visibleUserIDs = [
    ...new Set(
      memberships.docs
        .map((membership) => userID(membership.user))
        .filter((id) => typeof id === 'number'),
    ),
  ]

  const users =
    visibleUserIDs.length > 0
      ? await payload.find({
          collection: 'users',
          depth: 0,
          limit: 200,
          overrideAccess: false,
          pagination: false,
          sort: 'email',
          user: currentUser,
          where: {
            id: {
              in: visibleUserIDs,
            },
          },
        })
      : { docs: [] as User[] }

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
    const assignedUser = userID(assignment.user)
    const events = accumulator.get(assignedUser) ?? []

    events.push(eventTitle(assignment.event))
    accumulator.set(assignedUser, events)

    return accumulator
  }, new Map<number, string[]>())

  const assignmentsByUserID = assignments.docs.reduce((accumulator, assignment) => {
    const assignedUser = userID(assignment.user)
    const existing = accumulator.get(assignedUser) ?? []

    existing.push(assignment as EventAssignment)
    accumulator.set(assignedUser, existing)

    return accumulator
  }, new Map<number, EventAssignment[]>())

  const membershipByUserID = new Map(
    activeMemberships.map((membership) => [userID(membership.user), membership]),
  )

  return (
    <Layout hideFooter hideHeader title="Users">
      <section className="space-y-4">
        {organizations.docs.length > 0 ? (
          <article className="us-panel px-5 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                Members and invites for the selected organization.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <InviteUserPanel
                  canInviteAdmin={isSuperAdminUser(currentUser)}
                  defaultOrganizationId={selectedOrganization?.id}
                  organizations={organizations.docs}
                />
                <Link
                  className="us-button-secondary px-4 py-2.5 text-sm font-medium"
                  href="/organizations"
                >
                  Organizations
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {organizations.docs.map((organization) => {
                const active = selectedOrganization?.id === organization.id

                return (
                  <Link
                    key={organization.id}
                    className="rounded-2xl border px-4 py-2 text-sm font-medium"
                    href={`/users?organization=${organization.slug}`}
                    style={{
                      backgroundColor: active ? 'var(--us-green-dark)' : 'white',
                      borderColor: active ? 'var(--us-green-dark)' : 'var(--us-border)',
                      color: active ? 'white' : 'var(--us-text)',
                    }}
                  >
                    {organization.name}
                  </Link>
                )
              })}
            </div>
          </article>
        ) : null}

        {selectedOrganization ? (
          <>
            {pendingRequests.length > 0 ? (
              <article className="us-panel px-6 py-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  Pending join requests
                </h3>
                <TruncatedList className="mt-4" itemLabel="requests" listClassName="space-y-3">
                  {pendingRequests.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex flex-col gap-3 rounded-3xl border bg-white/75 px-4 py-4 md:flex-row md:items-center md:justify-between"
                      style={{ borderColor: 'var(--us-border)' }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                          {userLabel(membership.user)}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                          Requested access to {selectedOrganization.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <form action={approveMembershipAction} id={`approve-membership-${membership.id}`}>
                          <input name="membershipId" type="hidden" value={membership.id} />
                          <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                        </form>
                        <form action={rejectMembershipAction} id={`reject-membership-${membership.id}`}>
                          <input name="membershipId" type="hidden" value={membership.id} />
                          <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                        </form>
                        <button
                          className="us-button-primary px-4 py-2.5 text-sm font-medium"
                          form={`approve-membership-${membership.id}`}
                          type="submit"
                        >
                          Approve
                        </button>
                        <ConfirmSubmitButton
                          action={rejectMembershipAction}
                          className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                          confirmMessage="Reject this join request? The user will remain outside the organization."
                          formId={`reject-membership-${membership.id}`}
                          title="Reject request"
                        >
                          Reject
                        </ConfirmSubmitButton>
                      </div>
                    </div>
                  ))}
                </TruncatedList>
              </article>
            ) : null}

            {pendingInvites.length > 0 ? (
              <article className="us-panel px-6 py-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  Pending invites
                </h3>
                <TruncatedList className="mt-4" itemLabel="invites" listClassName="space-y-3">
                  {pendingInvites.map((membership) => {
                    const invitedUser = membership.user
                    const invitedUserID = userID(invitedUser)

                    return (
                      <div
                        key={membership.id}
                        className="flex flex-col gap-3 rounded-3xl border bg-white/75 px-4 py-4 md:flex-row md:items-center md:justify-between"
                        style={{ borderColor: 'var(--us-border)' }}
                      >
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                            {userLabel(invitedUser)}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                            Waiting for activation in {selectedOrganization.name}
                          </p>
                        </div>
                        <form action={resendInviteForUserAction} id={`resend-invite-${invitedUserID}`}>
                          <input name="id" type="hidden" value={invitedUserID} />
                          <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                            Resend invite
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </TruncatedList>
              </article>
            ) : null}

            <article className="us-panel overflow-hidden px-4 py-4">
              <h3 className="px-3 text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                Members in {selectedOrganization.name}
              </h3>
              <div className="hidden grid-cols-[1fr_1.2fr_1.4fr_90px_150px_44px] gap-4 px-3 pb-3 pt-4 text-xs font-semibold uppercase tracking-[0.12em] lg:grid" style={{ color: 'var(--us-muted)' }}>
                <span>Username</span>
                <span>Email</span>
                <span>Events</span>
                <span>Active?</span>
                <span>Role</span>
                <span />
              </div>

              <TruncatedList itemLabel="members" listClassName="space-y-3">
                {users.docs.map((user) => {
                  const membership = membershipByUserID.get(user.id)
                  const formPrefix = `user-${user.id}`

                  return (
                    <details key={user.id} className="group rounded-3xl border bg-white/75 px-4 py-4 lg:px-3 lg:py-3" style={{ borderColor: 'var(--us-border)' }}>
                      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-3 lg:grid-cols-[1fr_1.2fr_1.4fr_90px_150px_44px] lg:items-center">
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                            {user.name}
                          </span>
                        </div>
                        <span className="us-chip us-chip-muted w-fit justify-self-end lg:justify-self-auto">
                          {user.role?.replace('_', ' ') ?? 'user'}
                          {membership ? ` / ${membership.roleInOrganization}` : ''}
                        </span>
                        <div className="break-all text-sm" style={{ color: 'var(--us-muted)' }}>
                          {user.email}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--us-muted)' }}>
                          {getUserEventSummary(user.id, userEvents)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-sm ${user.active === false ? 'opacity-35' : ''}`} style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
                            {user.active === false ? '' : '✓'}
                          </span>
                        </div>
                        <span className="justify-self-end text-2xl leading-none transition group-open:rotate-180 lg:justify-self-auto" style={{ color: 'var(--us-blue-dark)' }}>
                          ˅
                        </span>
                      </summary>

                      <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--us-border)' }}>
                        <p className="mb-3 text-xs" style={{ color: 'var(--us-muted)' }}>
                          Invitation: {user.invitationStatus ?? 'none'}
                        </p>
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

                        {user.role === 'moderator' || isSuperAdminUser(currentUser) ? (
                          <UserEventAssignmentsSection
                            assignments={assignmentsByUserID.get(user.id) ?? []}
                            assignableEvents={assignableEvents.map((event) => ({
                              id: event.id,
                              slug: event.slug,
                              title: event.title,
                            }))}
                            canManageAssignments={isAdminUser(currentUser)}
                            canSetAdminRole={isSuperAdminUser(currentUser)}
                            targetUserID={user.id}
                          />
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={sendPasswordResetForUserAction} id={`${formPrefix}-reset`}>
                            <input name="id" type="hidden" value={user.id} />
                            <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                            <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                              Send password reset
                            </button>
                          </form>

                          {user.invitationStatus === 'pending' ? (
                            <form action={resendInviteForUserAction} id={`${formPrefix}-resend`}>
                              <input name="id" type="hidden" value={user.id} />
                              <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                              <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                                Resend invite
                              </button>
                            </form>
                          ) : null}
                        </div>

                        {membership ? (
                          <form action={removeMembershipAction} className="mt-4" id={`${formPrefix}-remove-membership`}>
                            <input name="membershipId" type="hidden" value={membership.id} />
                            <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                            <p className="mb-3 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
                              Remove from organization keeps the global account but revokes access to this organization.
                            </p>
                            <ConfirmSubmitButton
                              action={removeMembershipAction}
                              confirmMessage={`Remove ${user.name} from ${selectedOrganization.name}? Their global account will remain.`}
                              formId={`${formPrefix}-remove-membership`}
                              title="Remove from organization"
                            >
                              Remove from organization
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}

                        {String(user.id) !== String(currentUser.id) ? (
                          <form action={deleteUserAction} className="mt-4" id={`${formPrefix}-delete`}>
                            <input name="id" type="hidden" value={user.id} />
                            <input name="organizationId" type="hidden" value={selectedOrganization.id} />
                            <p className="mb-3 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
                              Deleting a user permanently removes their account, memberships, and event assignments.
                            </p>
                            <ConfirmSubmitButton
                              action={deleteUserAction}
                              confirmMessage={`Delete ${user.name} permanently? This cannot be undone.`}
                              formId={`${formPrefix}-delete`}
                              title="Delete user"
                            >
                              Delete user
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </details>
                  )
                })}
              </TruncatedList>
            </article>
          </>
        ) : (
          <article className="us-panel px-6 py-6">
            <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
              No organizations are available yet.{' '}
              {isSuperAdminUser(currentUser) ? (
                <>
                  <Link className="font-medium hover:underline" href="/organizations" style={{ color: 'var(--us-blue-dark)' }}>
                    Create an organization
                  </Link>{' '}
                  to start inviting users.
                </>
              ) : (
                'Ask a super admin to add you to an organization.'
              )}
            </p>
          </article>
        )}
      </section>
    </Layout>
  )
}



import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEventsForOrganization } from '@/lib/dashboard-data'
import { getManageableOrganizations } from '@/lib/organization-data'
import { eventTitle, userID } from '@/lib/organization-user-utils'
import { getVisibleUserIDsForRequest } from '@/lib/organizations'
import type { EventAssignment, Organization, OrganizationMembership, User } from '@/payload-types'

export type OrganizationUsersData = {
  activeMemberships: OrganizationMembership[]
  assignableEvents: Array<{ id: number; slug: string; title: string }>
  assignableUsers: User[]
  assignmentsByUserID: Map<number, EventAssignment[]>
  manageableOrganizations: Organization[]
  membershipByUserID: Map<number, OrganizationMembership>
  organizationMembershipsByUserID: Map<number, OrganizationMembership[]>
  pendingInvites: OrganizationMembership[]
  pendingRequests: OrganizationMembership[]
  users: User[]
  userEvents: Map<number, string[]>
}

export async function getOrganizationUsersData(organizationId: number): Promise<OrganizationUsersData> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  const [memberships, assignableEvents, manageableOrganizations] = await Promise.all([
    payload.find({
      collection: 'organization-memberships',
      depth: 1,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      user: currentUser,
      where: {
        organization: {
          equals: organizationId,
        },
      },
    }),
    getDashboardEventsForOrganization(organizationId, 500),
    getManageableOrganizations(),
  ])

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

  const visibleAdminUserIDs = await getVisibleUserIDsForRequest({ payload, user: currentUser } as never)
  const allVisibleUsers = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 500,
    overrideAccess: false,
    pagination: false,
    sort: 'email',
    user: currentUser,
    where: visibleAdminUserIDs
      ? {
          id: {
            in: visibleAdminUserIDs,
          },
        }
      : undefined,
  })

  const currentOrganizationMemberUserIDs = new Set(
    memberships.docs
      .filter((membership) => membership.status === 'active' || membership.status === 'pending')
      .map((membership) => userID(membership.user))
      .filter((id): id is number => typeof id === 'number'),
  )
  const assignableUsers = allVisibleUsers.docs.filter((user) => !currentOrganizationMemberUserIDs.has(user.id))

  const manageableOrganizationIDs = manageableOrganizations.map((organization) => organization.id)
  const organizationMemberships =
    visibleUserIDs.length > 0 && manageableOrganizationIDs.length > 0
      ? await payload.find({
          collection: 'organization-memberships',
          depth: 1,
          limit: 1000,
          overrideAccess: false,
          pagination: false,
          user: currentUser,
          where: {
            and: [
              {
                user: {
                  in: visibleUserIDs,
                },
              },
              {
                organization: {
                  in: manageableOrganizationIDs,
                },
              },
              {
                status: {
                  in: ['active', 'pending'],
                },
              },
            ],
          },
        })
      : { docs: [] as OrganizationMembership[] }

  const orgEventIDs = assignableEvents.map((event) => event.id)
  const assignments =
    orgEventIDs.length > 0
      ? await payload
          .find({
            collection: 'event-assignments',
            depth: 1,
            limit: 500,
            overrideAccess: false,
            pagination: false,
            user: currentUser,
            where: {
              event: {
                in: orgEventIDs,
              },
            },
          })
          .catch(() => ({ docs: [] as EventAssignment[] }))
      : { docs: [] as EventAssignment[] }

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

    existing.push(assignment)
    accumulator.set(assignedUser, existing)

    return accumulator
  }, new Map<number, EventAssignment[]>())

  const membershipByUserID = new Map(
    activeMemberships.map((membership) => [userID(membership.user), membership]),
  )

  const organizationMembershipsByUserID = organizationMemberships.docs.reduce((accumulator, membership) => {
    const memberUserID = userID(membership.user)
    const existing = accumulator.get(memberUserID) ?? []

    existing.push(membership)
    accumulator.set(memberUserID, existing)

    return accumulator
  }, new Map<number, OrganizationMembership[]>())

  return {
    activeMemberships,
    assignableEvents: assignableEvents.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
    })),
    assignableUsers,
    assignmentsByUserID,
    manageableOrganizations,
    membershipByUserID,
    organizationMembershipsByUserID,
    pendingInvites,
    pendingRequests,
    userEvents,
    users: users.docs,
  }
}

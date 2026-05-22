import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEventsForOrganization } from '@/lib/dashboard-data'
import { eventTitle, userID } from '@/lib/organization-user-utils'
import type { EventAssignment, OrganizationMembership, User } from '@/payload-types'

export type OrganizationUsersData = {
  activeMemberships: OrganizationMembership[]
  assignableEvents: Array<{ id: number; slug: string; title: string }>
  assignmentsByUserID: Map<number, EventAssignment[]>
  membershipByUserID: Map<number, OrganizationMembership>
  pendingInvites: OrganizationMembership[]
  pendingRequests: OrganizationMembership[]
  users: User[]
  userEvents: Map<number, string[]>
}

export async function getOrganizationUsersData(organizationId: number): Promise<OrganizationUsersData> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  const [memberships, assignableEvents] = await Promise.all([
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

  return {
    activeMemberships,
    assignableEvents: assignableEvents.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
    })),
    assignmentsByUserID,
    membershipByUserID,
    pendingInvites,
    pendingRequests,
    userEvents,
    users: users.docs,
  }
}

import type { Payload, PayloadRequest, Where } from 'payload'

import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { OrganizationMembership, User } from '@/payload-types'

export type OrganizationRole = 'owner' | 'manager' | 'moderator' | 'viewer'
export type OrganizationMembershipStatus = 'pending' | 'active' | 'rejected' | 'revoked'

export function isOrganizationManagerRole(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'manager'
}

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

function uniqueIDs(ids: Array<number | string>): Array<number | string> {
  return [...new Set(ids.map((value) => String(value)))].map((value) => {
    const numericValue = Number(value)
    return Number.isNaN(numericValue) ? value : numericValue
  })
}

export async function getActiveMembershipsForUser(req: PayloadRequest, userID?: number | string | null) {
  const comparableUserID = normalizeRelationshipID(userID ?? req.user?.id)

  if (!comparableUserID) {
    return [] as OrganizationMembership[]
  }

  const result = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          user: {
            equals: comparableUserID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return result.docs
}

export function countUniqueActiveOrganizations(memberships: OrganizationMembership[]): number {
  const organizationIDs = memberships
    .map((membership) => normalizeRelationshipID(membership.organization))
    .filter((value): value is number | string => value !== null)

  return uniqueIDs(organizationIDs).length
}

export async function countActiveOrganizationsForUser(payload: Payload, userID: number | string) {
  const memberships = await getActiveMembershipsForUser(
    { payload, user: { id: userID } } as PayloadRequest,
    userID,
  )

  return countUniqueActiveOrganizations(memberships)
}

/** Show Events / Organizations nav when user spans multiple orgs or is super admin. */
export function shouldShowMultiOrganizationNav(user: User | null | undefined, activeOrganizationCount: number) {
  if (!user) {
    return false
  }

  if (isSuperAdminUser(user)) {
    return true
  }

  return activeOrganizationCount > 1
}

export async function getManageableOrganizationIDs(req: PayloadRequest) {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  if (!isAdminUser(req.user)) {
    return []
  }

  const memberships = await getActiveMembershipsForUser(req)
  const managedOrganizationIDs = memberships
    .filter((membership) => isOrganizationManagerRole(membership.roleInOrganization))
    .map((membership) => normalizeRelationshipID(membership.organization))
    .filter((value): value is number | string => value !== null)

  return uniqueIDs(managedOrganizationIDs)
}

export async function getManageableOrganizationWhere(req: PayloadRequest): Promise<Where | true | false> {
  const organizationIDs = await getManageableOrganizationIDs(req)

  if (organizationIDs === null) {
    return true
  }

  if (organizationIDs.length === 0) {
    return false
  }

  return {
    id: {
      in: organizationIDs,
    },
  }
}

export async function getVisibleUserIDsForRequest(req: PayloadRequest): Promise<Array<number | string> | null> {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  if (!isAdminUser(req.user)) {
    return req.user?.id ? [req.user.id] : []
  }

  const organizationIDs = await getManageableOrganizationIDs(req)

  if (organizationIDs === null) {
    return null
  }

  if (organizationIDs.length === 0) {
    return req.user?.id ? [req.user.id] : []
  }

  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            in: organizationIDs,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const userIDs = memberships.docs
    .map((membership) => normalizeRelationshipID(membership.user))
    .filter((value): value is number | string => value !== null)

  const currentUserID = normalizeRelationshipID(req.user?.id)

  if (currentUserID) {
    userIDs.push(currentUserID)
  }

  return uniqueIDs(userIDs)
}

export async function canManageUserInOrganization(
  req: PayloadRequest,
  targetUserID: number | string,
  organizationID: number | string,
) {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  const manageableOrganizationIDs = await getManageableOrganizationIDs(req)

  if (manageableOrganizationIDs === null) {
    return true
  }

  if (!manageableOrganizationIDs.includes(organizationID)) {
    return false
  }

  const membership = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            equals: organizationID,
          },
        },
        {
          user: {
            equals: targetUserID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return membership.docs.length > 0 || String(req.user?.id) === String(targetUserID)
}

export async function getUserIDsInOrganizations(
  req: PayloadRequest,
  organizationIDs: Array<number | string>,
  statuses: OrganizationMembershipStatus[] = ['active', 'pending'],
) {
  if (organizationIDs.length === 0) {
    return []
  }

  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            in: organizationIDs,
          },
        },
        {
          status: {
            in: statuses,
          },
        },
      ],
    },
  })

  return uniqueIDs(
    memberships.docs
      .map((membership) => normalizeRelationshipID(membership.user))
      .filter((value): value is number | string => value !== null),
  )
}

export async function userHasActiveOrganizationMembership(
  req: PayloadRequest,
  userID: number | string,
  organizationID: number | string,
) {
  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            equals: organizationID,
          },
        },
        {
          user: {
            equals: userID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return memberships.docs.length > 0
}

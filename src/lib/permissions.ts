import type { PayloadRequest, Where } from 'payload'

export type UserRole = 'super_admin' | 'admin' | 'moderator'
export type EventRole = 'admin' | 'moderator' | 'viewer'

export type AppUser = {
  id?: number | string | null
  role?: string | null
}

type EventWithOwner = {
  createdBy?: number | string | { id?: number | string } | null
}

function toComparableID(
  value: number | string | { id?: number | string } | null | undefined,
): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id ?? null
  }

  return null
}

export function hasRole(user: AppUser | null | undefined, roles: UserRole[]): boolean {
  if (!user?.role) {
    return false
  }

  return roles.includes(user.role as UserRole)
}

export function isSuperAdminUser(user: AppUser | null | undefined): boolean {
  return user?.role === 'super_admin'
}

export function isAdminUser(user: AppUser | null | undefined): boolean {
  return hasRole(user, ['super_admin', 'admin'])
}

export function isModeratorUser(user: AppUser | null | undefined): boolean {
  return hasRole(user, ['super_admin', 'admin', 'moderator'])
}

function uniqueIDs(ids: Array<number | string>): Array<number | string> {
  return [...new Set(ids.map((value) => String(value)))].map((value) => {
    const numericValue = Number(value)
    return Number.isNaN(numericValue) ? value : numericValue
  })
}

export async function getOwnedEventIDs(req: PayloadRequest) {
  const userId = toComparableID(req.user?.id)

  if (!userId) {
    return []
  }

  const result = await req.payload.find({
    collection: 'events',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      createdBy: {
        equals: userId,
      },
    },
  })

  return result.docs
    .map((event) => toComparableID(event.id))
    .filter((value): value is number | string => value !== null)
}

export async function getEventAssignments(req: PayloadRequest) {
  const userId = toComparableID(req.user?.id)

  if (!userId) {
    return []
  }

  const result = await req.payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      user: {
        equals: userId,
      },
    },
  })

  return result.docs
}

export async function getAccessibleEventIDs(req: PayloadRequest) {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  const assignments = await getEventAssignments(req)

  return assignments
    .map((assignment) => toComparableID(assignment.event))
    .filter((value): value is number | string => value !== null)
}

export async function getManageableEventIDs(req: PayloadRequest) {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  const assignments = await getEventAssignments(req)
  const ownedEventIDs = await getOwnedEventIDs(req)

  return uniqueIDs([
    ...ownedEventIDs,
    ...assignments
      .filter((assignment) => assignment.roleForEvent === 'admin')
      .map((assignment) => toComparableID(assignment.event))
      .filter((value): value is number | string => value !== null),
  ])
}

export async function getChannelManageableEventIDs(req: PayloadRequest) {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  const assignments = await getEventAssignments(req)
  const ownedEventIDs = await getOwnedEventIDs(req)

  return uniqueIDs([
    ...ownedEventIDs,
    ...assignments
      .filter((assignment) => assignment.roleForEvent === 'admin' || assignment.roleForEvent === 'moderator')
      .map((assignment) => toComparableID(assignment.event))
      .filter((value): value is number | string => value !== null),
  ])
}

export async function getViewableEventIDs(req: PayloadRequest) {
  if (isSuperAdminUser(req.user)) {
    return null
  }

  const ownedEventIDs = await getOwnedEventIDs(req)
  const assignedEventIDs = (await getAccessibleEventIDs(req)) ?? []

  return uniqueIDs([...ownedEventIDs, ...assignedEventIDs])
}

export function whereCreatedByOrIDs(userId: number | string | null, ids: Array<number | string>): Where | false {
  if (!userId && ids.length === 0) {
    return false
  }

  if (userId && ids.length === 0) {
    return {
      createdBy: {
        equals: userId,
      },
    }
  }

  if (!userId && ids.length > 0) {
    return {
      id: {
        in: ids,
      },
    }
  }

  return {
    or: [
      {
        createdBy: {
          equals: userId,
        },
      },
      {
        id: {
          in: ids,
        },
      },
    ],
  }
}

export async function canUserManageEventByID(req: PayloadRequest, eventID: number | string | null | undefined) {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isAdminUser(req.user)) {
    return false
  }

  const userId = toComparableID(req.user?.id)
  const comparableEventID = toComparableID(eventID)

  if (!userId || !comparableEventID) {
    return false
  }

  const event = await req.payload.findByID({
    collection: 'events',
    id: comparableEventID,
    overrideAccess: true,
    req,
  })

  if (toComparableID((event as EventWithOwner).createdBy) === userId) {
    return true
  }

  const manageableEventIDs = await getManageableEventIDs(req)

  if (manageableEventIDs === null) {
    return true
  }

  return manageableEventIDs.includes(comparableEventID)
}

export async function canUserManageChannelsForEventByID(
  req: PayloadRequest,
  eventID: number | string | null | undefined,
) {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isModeratorUser(req.user)) {
    return false
  }

  const userId = toComparableID(req.user?.id)
  const comparableEventID = toComparableID(eventID)

  if (!userId || !comparableEventID) {
    return false
  }

  const event = await req.payload.findByID({
    collection: 'events',
    id: comparableEventID,
    overrideAccess: true,
    req,
  })

  if (toComparableID((event as EventWithOwner).createdBy) === userId) {
    return true
  }

  const manageableEventIDs = await getChannelManageableEventIDs(req)

  if (manageableEventIDs === null) {
    return true
  }

  return manageableEventIDs.includes(comparableEventID)
}

export async function canUserReadEventByID(req: PayloadRequest, eventID: number | string | null | undefined) {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  const userId = toComparableID(req.user?.id)
  const comparableEventID = toComparableID(eventID)

  if (!userId || !comparableEventID) {
    return false
  }

  const event = await req.payload.findByID({
    collection: 'events',
    id: comparableEventID,
    overrideAccess: true,
    req,
  })

  if (toComparableID((event as EventWithOwner).createdBy) === userId) {
    return true
  }

  const viewableEventIDs = await getViewableEventIDs(req)

  if (viewableEventIDs === null) {
    return true
  }

  return viewableEventIDs.includes(comparableEventID)
}

export async function getManageableEventWhere(req: PayloadRequest): Promise<Where | false | true> {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isAdminUser(req.user)) {
    return false
  }

  const userId = toComparableID(req.user?.id)

  if (!userId) {
    return false
  }

  const eventIDs = await getManageableEventIDs(req)

  if (eventIDs === null) {
    return true
  }

  return whereCreatedByOrIDs(userId, eventIDs)
}

export async function getChannelManageableEventWhere(req: PayloadRequest): Promise<Where | false | true> {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isModeratorUser(req.user)) {
    return false
  }

  const userId = toComparableID(req.user?.id)

  if (!userId) {
    return false
  }

  const eventIDs = await getChannelManageableEventIDs(req)

  return whereCreatedByOrIDs(userId, eventIDs ?? [])
}

export async function getReadableEventWhere(req: PayloadRequest): Promise<Where | false | true> {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  if (!isModeratorUser(req.user)) {
    return false
  }

  const userId = toComparableID(req.user?.id)

  if (!userId) {
    return false
  }

  const eventIDs = await getViewableEventIDs(req)

  if (eventIDs === null) {
    return true
  }

  return whereCreatedByOrIDs(userId, eventIDs)
}

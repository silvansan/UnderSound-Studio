import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'

import { LEGACY_V1_CONFIG_EXPORT_KIND, normalizeConfigExportKind } from '@/lib/legacy-import'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type {
  Channel,
  Event,
  EventAssignment,
  Organization,
  OrganizationMembership,
  SiteSetting,
  User,
} from '@/payload-types'

export type ConfigExportScope = 'channels' | 'events' | 'full'

type ExportedOrganization = Pick<Organization, 'active' | 'description' | 'name' | 'slug' | 'supportEmail'>

type ExportedOrganizationMembership = Pick<OrganizationMembership, 'roleInOrganization' | 'status'> & {
  organizationSlug: string
  userEmail: string
}

type ExportedEvent = Pick<
  Event,
  | 'dateEnd'
  | 'dateStart'
  | 'defaultLanguage'
  | 'description'
  | 'listenerPasswordEnabled'
  | 'listenerPasswordHash'
  | 'location'
  | 'publicListenerEnabled'
  | 'qrSettings'
  | 'slug'
  | 'speakerPasswordEnabled'
  | 'speakerPasswordHash'
  | 'status'
  | 'themeOverride'
  | 'title'
> & {
  organizationSlug?: string
}

type ExportedChannel = Pick<
  Channel,
  | 'description'
  | 'enabled'
  | 'hlsEnabled'
  | 'icecastFallbackUrl'
  | 'languageCode'
  | 'languageLabel'
  | 'listenerPageEnabled'
  | 'listenerTokenMode'
  | 'livekitRoomName'
  | 'name'
  | 'roomName'
  | 'slug'
  | 'sortOrder'
  | 'speakerPageEnabled'
  | 'speakerPasswordEnabled'
  | 'speakerPasswordHash'
  | 'webrtcEnabled'
> & {
  eventSlug: string
}

type ExportedSiteSettings = Partial<
  Pick<
    SiteSetting,
    | 'allowPublicListenerPages'
    | 'defaultQrStyle'
    | 'defaultThemeColors'
    | 'defaultTokenExpiry'
    | 'livekitPublicUrl'
    | 'publicBaseUrl'
    | 'requireEmailVerification'
    | 'siteName'
    | 'supportEmail'
  >
>

type ExportedUser = Pick<
  User,
  'active' | 'email' | 'invitationStatus' | 'name' | 'preferredLanguage' | 'role'
>

type ExportedEventAssignment = Pick<EventAssignment, 'permissions' | 'roleForEvent'> & {
  eventSlug: string
  userEmail: string
}

export type AblautConfigExport = {
  assignments?: ExportedEventAssignment[]
  channels?: ExportedChannel[]
  events?: ExportedEvent[]
  exportedAt: string
  kind: 'ablaut-config'
  legacySource?: typeof LEGACY_V1_CONFIG_EXPORT_KIND
  organizationMemberships?: ExportedOrganizationMembership[]
  organizations?: ExportedOrganization[]
  settings?: ExportedSiteSettings
  users?: ExportedUser[]
  version: 1 | 2
}

function assertCanTransferConfig(user: User | null | undefined, scope: ConfigExportScope) {
  if (scope === 'full') {
    if (!isSuperAdminUser(user)) {
      throw new Error('Only super admins can transfer full site config.')
    }

    return
  }

  if (!isAdminUser(user)) {
    throw new Error('Only admins can transfer event and channel config.')
  }
}

function normalizeScope(value: string | null | undefined): ConfigExportScope {
  if (value === 'channels' || value === 'full') {
    return value
  }

  return 'events'
}

function organizationConfig(organization: Organization): ExportedOrganization {
  return {
    active: organization.active,
    description: organization.description,
    name: organization.name,
    slug: organization.slug,
    supportEmail: organization.supportEmail,
  }
}

function organizationMembershipConfig(
  membership: OrganizationMembership,
): ExportedOrganizationMembership | null {
  const user = typeof membership.user === 'object' ? membership.user : null
  const organization = typeof membership.organization === 'object' ? membership.organization : null

  if (!user?.email || !organization?.slug) {
    return null
  }

  return {
    organizationSlug: organization.slug,
    roleInOrganization: membership.roleInOrganization,
    status: membership.status,
    userEmail: user.email,
  }
}

function eventConfig(event: Event): ExportedEvent {
  const organization = typeof event.organization === 'object' ? event.organization : null

  return {
    dateEnd: event.dateEnd,
    dateStart: event.dateStart,
    defaultLanguage: event.defaultLanguage,
    description: event.description,
    listenerPasswordEnabled: event.listenerPasswordEnabled,
    listenerPasswordHash: event.listenerPasswordHash,
    location: event.location,
    organizationSlug: organization?.slug,
    publicListenerEnabled: event.publicListenerEnabled,
    qrSettings: event.qrSettings,
    slug: event.slug,
    speakerPasswordEnabled: event.speakerPasswordEnabled,
    speakerPasswordHash: event.speakerPasswordHash,
    status: event.status,
    themeOverride: event.themeOverride,
    title: event.title,
  }
}

function channelConfig(channel: Channel): ExportedChannel {
  const event = typeof channel.event === 'object' ? channel.event : null

  return {
    description: channel.description,
    enabled: channel.enabled,
    eventSlug: event?.slug ?? String(channel.event),
    hlsEnabled: channel.hlsEnabled,
    icecastFallbackUrl: channel.icecastFallbackUrl,
    languageCode: channel.languageCode,
    languageLabel: channel.languageLabel,
    listenerPageEnabled: channel.listenerPageEnabled,
    listenerTokenMode: channel.listenerTokenMode,
    livekitRoomName: channel.livekitRoomName,
    name: channel.name,
    roomName: channel.roomName,
    slug: channel.slug,
    sortOrder: channel.sortOrder,
    speakerPageEnabled: channel.speakerPageEnabled,
    speakerPasswordEnabled: channel.speakerPasswordEnabled,
    speakerPasswordHash: channel.speakerPasswordHash,
    webrtcEnabled: channel.webrtcEnabled,
  }
}

function settingsConfig(settings: SiteSetting): ExportedSiteSettings {
  return {
    allowPublicListenerPages: settings.allowPublicListenerPages,
    defaultQrStyle: settings.defaultQrStyle,
    defaultThemeColors: settings.defaultThemeColors,
    defaultTokenExpiry: settings.defaultTokenExpiry,
    livekitPublicUrl: settings.livekitPublicUrl,
    publicBaseUrl: settings.publicBaseUrl,
    requireEmailVerification: settings.requireEmailVerification,
    siteName: settings.siteName,
    supportEmail: settings.supportEmail,
  }
}

function userConfig(user: User): ExportedUser {
  return {
    active: user.active,
    email: user.email,
    invitationStatus: user.invitationStatus,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    role: user.role,
  }
}

function assignmentConfig(assignment: EventAssignment): ExportedEventAssignment | null {
  const user = typeof assignment.user === 'object' ? assignment.user : null
  const event = typeof assignment.event === 'object' ? assignment.event : null

  if (!user?.email || !event?.slug) {
    return null
  }

  return {
    eventSlug: event.slug,
    permissions: assignment.permissions,
    roleForEvent: assignment.roleForEvent,
    userEmail: user.email,
  }
}

export async function exportAblautConfig(user: User, scopeValue?: string | null): Promise<AblautConfigExport> {
  const scope = normalizeScope(scopeValue)
  assertCanTransferConfig(user, scope)

  const payload = await getPayload({ config: configPromise })
  const output: AblautConfigExport = {
    exportedAt: new Date().toISOString(),
    kind: 'ablaut-config',
    version: 2,
  }

  if (scope === 'full') {
    const organizations = await payload.find({
      collection: 'organizations',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: 'slug',
    })

    output.organizations = organizations.docs.map(organizationConfig)

    const memberships = await payload.find({
      collection: 'organization-memberships',
      depth: 1,
      limit: 5000,
      overrideAccess: true,
      pagination: false,
      sort: ['organization', 'user'],
    })

    output.organizationMemberships = memberships.docs
      .map(organizationMembershipConfig)
      .filter((value): value is ExportedOrganizationMembership => value !== null)
  }

  if (scope === 'events' || scope === 'full') {
    const events = await payload.find({
      collection: 'events',
      depth: 1,
      limit: 1000,
      overrideAccess: scope === 'full',
      pagination: false,
      sort: 'slug',
      user,
    })

    output.events = events.docs.map(eventConfig)
  }

  if (scope === 'channels' || scope === 'full') {
    const channels = await payload.find({
      collection: 'channels',
      depth: 1,
      limit: 2000,
      overrideAccess: scope === 'full',
      pagination: false,
      sort: ['event', 'sortOrder', 'slug'],
      user,
    })

    output.channels = channels.docs.map(channelConfig)
  }

  if (scope === 'full') {
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
    })

    output.settings = settingsConfig(settings)

    const users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 2000,
      overrideAccess: true,
      pagination: false,
      sort: 'email',
    })

    output.users = users.docs.map(userConfig)

    const assignments = await payload.find({
      collection: 'event-assignments',
      depth: 1,
      limit: 5000,
      overrideAccess: true,
      pagination: false,
      sort: ['event', 'user'],
    })

    output.assignments = assignments.docs.map(assignmentConfig).filter((value): value is ExportedEventAssignment => value !== null)
  }

  return output
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asExportedOrganization(value: unknown): ExportedOrganization | null {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.slug !== 'string') {
    return null
  }

  return {
    active: typeof value.active === 'boolean' ? value.active : true,
    description: typeof value.description === 'string' ? value.description : undefined,
    name: value.name,
    slug: value.slug,
    supportEmail: typeof value.supportEmail === 'string' ? value.supportEmail : undefined,
  }
}

function asExportedOrganizationMembership(value: unknown): ExportedOrganizationMembership | null {
  if (
    !isRecord(value) ||
    typeof value.organizationSlug !== 'string' ||
    typeof value.userEmail !== 'string' ||
    (value.roleInOrganization !== 'owner' &&
      value.roleInOrganization !== 'manager' &&
      value.roleInOrganization !== 'moderator' &&
      value.roleInOrganization !== 'viewer') ||
    (value.status !== 'pending' &&
      value.status !== 'active' &&
      value.status !== 'rejected' &&
      value.status !== 'revoked')
  ) {
    return null
  }

  return {
    organizationSlug: value.organizationSlug,
    roleInOrganization: value.roleInOrganization,
    status: value.status,
    userEmail: value.userEmail.trim().toLowerCase(),
  }
}

function asExportedEvent(value: unknown): ExportedEvent | null {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.slug !== 'string') {
    return null
  }

  return {
    ...(value as ExportedEvent),
    organizationSlug: typeof value.organizationSlug === 'string' ? value.organizationSlug : undefined,
  }
}

function asExportedChannel(value: unknown): ExportedChannel | null {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.eventSlug !== 'string'
  ) {
    return null
  }

  return value as ExportedChannel
}

function asExportedUser(value: unknown): ExportedUser | null {
  if (!isRecord(value) || typeof value.email !== 'string' || typeof value.name !== 'string') {
    return null
  }

  const role = value.role === 'super_admin' || value.role === 'admin' ? value.role : 'moderator'

  return {
    active: typeof value.active === 'boolean' ? value.active : true,
    email: value.email.trim().toLowerCase(),
    invitationStatus: value.invitationStatus === 'accepted' || value.invitationStatus === 'expired' ? value.invitationStatus : 'pending',
    name: value.name,
    preferredLanguage: typeof value.preferredLanguage === 'string' ? value.preferredLanguage : 'en',
    role,
  }
}

function asExportedAssignment(value: unknown): ExportedEventAssignment | null {
  if (
    !isRecord(value) ||
    typeof value.eventSlug !== 'string' ||
    typeof value.userEmail !== 'string' ||
    (value.roleForEvent !== 'admin' && value.roleForEvent !== 'moderator' && value.roleForEvent !== 'viewer')
  ) {
    return null
  }

  return {
    eventSlug: value.eventSlug,
    permissions: isRecord(value.permissions) ? value.permissions : undefined,
    roleForEvent: value.roleForEvent,
    userEmail: value.userEmail.trim().toLowerCase(),
  } as ExportedEventAssignment
}

function isExportedEvent(value: ExportedEvent | null): value is ExportedEvent {
  return value !== null
}

function isExportedChannel(value: ExportedChannel | null): value is ExportedChannel {
  return value !== null
}

function isExportedUser(value: ExportedUser | null): value is ExportedUser {
  return value !== null
}

function isExportedAssignment(value: ExportedEventAssignment | null): value is ExportedEventAssignment {
  return value !== null
}

function isExportedOrganization(value: ExportedOrganization | null): value is ExportedOrganization {
  return value !== null
}

function isExportedOrganizationMembership(
  value: ExportedOrganizationMembership | null,
): value is ExportedOrganizationMembership {
  return value !== null
}

async function resolveOrganizationID(
  payload: Awaited<ReturnType<typeof getPayload>>,
  organizationSlug: string | undefined,
  organizationIDBySlug: Map<string, number>,
) {
  if (!organizationSlug) {
    return null
  }

  const cached = organizationIDBySlug.get(organizationSlug)

  if (cached) {
    return cached
  }

  const organizations = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: organizationSlug,
      },
    },
  })

  const organization = organizations.docs[0]

  if (!organization) {
    return null
  }

  organizationIDBySlug.set(organizationSlug, organization.id)

  return organization.id
}

function isSupportedConfigKind(kind: unknown): boolean {
  return normalizeConfigExportKind(kind) === 'ablaut-config'
}

export async function importAblautConfig(user: User, input: unknown, scopeValue?: string | null) {
  const scope = normalizeScope(scopeValue)
  assertCanTransferConfig(user, scope)

  if (!isRecord(input) || !isSupportedConfigKind(input.kind)) {
    throw new Error('Import file is not an ablaut config export.')
  }

  const payload = await getPayload({ config: configPromise })
  const organizations = Array.isArray(input.organizations)
    ? input.organizations.map(asExportedOrganization).filter(isExportedOrganization)
    : []
  const organizationMemberships = Array.isArray(input.organizationMemberships)
    ? input.organizationMemberships.map(asExportedOrganizationMembership).filter(isExportedOrganizationMembership)
    : []
  const events = Array.isArray(input.events) ? input.events.map(asExportedEvent).filter(isExportedEvent) : []
  const channels = Array.isArray(input.channels) ? input.channels.map(asExportedChannel).filter(isExportedChannel) : []
  const users = Array.isArray(input.users) ? input.users.map(asExportedUser).filter(isExportedUser) : []
  const assignments = Array.isArray(input.assignments)
    ? input.assignments.map(asExportedAssignment).filter(isExportedAssignment)
    : []
  const organizationIDBySlug = new Map<string, number>()

  if (scope === 'full' && organizations.length > 0) {
    for (const organization of organizations) {
      const existing = await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          slug: {
            equals: organization.slug,
          },
        },
      })

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'organizations',
          data: organization,
          overrideAccess: true,
        })
        organizationIDBySlug.set(organization.slug, existing.docs[0].id)
      } else {
        const created = await payload.create({
          collection: 'organizations',
          data: organization,
          overrideAccess: true,
        })
        organizationIDBySlug.set(organization.slug, created.id)
      }
    }
  }

  if (scope === 'full' && users.length > 0) {
    for (const importedUser of users) {
      const existing = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: importedUser.email,
          },
        },
      })

      const userData = {
        active: importedUser.active !== false,
        email: importedUser.email,
        invitationStatus: importedUser.invitationStatus ?? 'pending',
        name: importedUser.name,
        preferredLanguage: importedUser.preferredLanguage ?? 'en',
        role: importedUser.role,
      }

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'users',
          data: userData,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'users',
          data: {
            ...userData,
            _verified: true,
            password: randomBytes(32).toString('base64url'),
          },
          disableVerificationEmail: true,
          overrideAccess: true,
        })
      }
    }
  }

  if (scope === 'full' && organizationMemberships.length > 0) {
    for (const membership of organizationMemberships) {
      const organizationID = await resolveOrganizationID(
        payload,
        membership.organizationSlug,
        organizationIDBySlug,
      )

      const assignedUser = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: membership.userEmail,
          },
        },
      })

      const targetUser = assignedUser.docs[0]

      if (!organizationID || !targetUser) {
        continue
      }

      const existing = await payload.find({
        collection: 'organization-memberships',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              organization: {
                equals: organizationID,
              },
            },
            {
              user: {
                equals: targetUser.id,
              },
            },
          ],
        },
      })

      const membershipData = {
        organization: organizationID,
        roleInOrganization: membership.roleInOrganization,
        status: membership.status,
        user: targetUser.id,
      }

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'organization-memberships',
          data: membershipData,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'organization-memberships',
          data: membershipData,
          overrideAccess: true,
        })
      }
    }
  }

  if ((scope === 'events' || scope === 'full') && events.length > 0) {
    for (const event of events) {
      const { organizationSlug, ...eventFields } = event
      const organizationID =
        scope === 'full'
          ? await resolveOrganizationID(payload, organizationSlug, organizationIDBySlug)
          : null

      const existing = await payload.find({
        collection: 'events',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          slug: {
            equals: event.slug,
          },
        },
      })

      const eventData = {
        ...eventFields,
        ...(organizationID ? { organization: organizationID } : {}),
      }

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'events',
          data: eventData,
          overrideAccess: scope === 'full',
          user,
        })
      } else {
        await payload.create({
          collection: 'events',
          data: eventData,
          overrideAccess: scope === 'full',
          user,
        })
      }
    }
  }

  if ((scope === 'channels' || scope === 'full') && channels.length > 0) {
    for (const channel of channels) {
      const event = await payload.find({
        collection: 'events',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          slug: {
            equals: channel.eventSlug,
          },
        },
      })
      const targetEvent = event.docs[0]

      if (!targetEvent) {
        continue
      }

      const existing = await payload.find({
        collection: 'channels',
        depth: 0,
        limit: 1,
        overrideAccess: scope === 'full',
        pagination: false,
        user,
        where: {
          and: [
            {
              event: {
                equals: targetEvent.id,
              },
            },
            {
              slug: {
                equals: channel.slug,
              },
            },
          ],
        },
      })

      const { eventSlug: _eventSlug, ...channelData } = channel

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'channels',
          data: {
            ...channelData,
            event: targetEvent.id,
          },
          overrideAccess: scope === 'full',
          user,
        })
      } else {
        await payload.create({
          collection: 'channels',
          data: {
            ...channelData,
            event: targetEvent.id,
          },
          overrideAccess: scope === 'full',
          user,
        })
      }
    }
  }

  if (scope === 'full' && isRecord(input.settings)) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: input.settings,
      overrideAccess: true,
    })
  }

  if (scope === 'full' && assignments.length > 0) {
    for (const assignment of assignments) {
      const [event, assignedUser] = await Promise.all([
        payload.find({
          collection: 'events',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            slug: {
              equals: assignment.eventSlug,
            },
          },
        }),
        payload.find({
          collection: 'users',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            email: {
              equals: assignment.userEmail,
            },
          },
        }),
      ])

      const targetEvent = event.docs[0]
      const targetUser = assignedUser.docs[0]

      if (!targetEvent || !targetUser) {
        continue
      }

      const existing = await payload.find({
        collection: 'event-assignments',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              event: {
                equals: targetEvent.id,
              },
            },
            {
              user: {
                equals: targetUser.id,
              },
            },
          ],
        },
      })

      const assignmentData = {
        event: targetEvent.id,
        permissions: assignment.permissions,
        roleForEvent: assignment.roleForEvent,
        user: targetUser.id,
      }

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'event-assignments',
          data: assignmentData,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'event-assignments',
          data: assignmentData,
          overrideAccess: true,
        })
      }
    }
  }
}


import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'

import { Layout } from '@/components/Layout'
import { OrganizationsManagement, type OrganizationSummary } from '@/components/OrganizationsManagement'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { getManageableOrganizationIDs } from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const metadata = pageMetadata('Organizations')

export const dynamic = 'force-dynamic'

async function buildOrganizationSummaries(
  organizationDocs: Array<{ id: number; name: string; slug: string }>,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<OrganizationSummary[]> {
  const eventsInOrgs = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    where: {
      organization: {
        exists: true,
      },
    },
  })
  const eventCountByOrganization = new Map<number, number>()

  for (const event of eventsInOrgs.docs) {
    const organizationID = typeof event.organization === 'number' ? event.organization : event.organization?.id

    if (typeof organizationID === 'number') {
      eventCountByOrganization.set(organizationID, (eventCountByOrganization.get(organizationID) ?? 0) + 1)
    }
  }

  return organizationDocs.map((organization) => ({
    eventCount: eventCountByOrganization.get(organization.id) ?? 0,
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  }))
}

export default async function OrganizationsPage() {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })
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

  const organizationSummaries = await buildOrganizationSummaries(organizations.docs, payload)

  return (
    <Layout title="Organizations">
      <section className="space-y-4">
        <article className="us-panel px-5 py-5 md:px-6 md:py-6">
          <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Create and manage organizations here. Member invites, roles, and join requests are handled on the{' '}
            <Link className="font-medium hover:underline" href="/users" style={{ color: 'var(--us-blue-dark)' }}>
              Users
            </Link>{' '}
            page per organization.
          </p>
        </article>

        <OrganizationsManagement
          isSuperAdmin={isSuperAdminUser(currentUser)}
          organizationSummaries={organizationSummaries}
        />
      </section>
    </Layout>
  )
}

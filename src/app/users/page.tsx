import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { InviteUserPanel } from '@/components/InviteUserPanel'
import { Layout } from '@/components/Layout'
import { TruncatedList } from '@/components/TruncatedList'
import { UserHubRow } from '@/components/UserHubRow'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { assignZebraTints } from '@/lib/list-group-tints'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import { getUsersHubData } from '@/lib/users-hub-data'

export const metadata = pageMetadata('Users')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ organization?: string }>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await requireAppUser()

  if (!isAdminUser(currentUser)) {
    notFound()
  }

  const { organization: organizationSlug } = await searchParams

  if (organizationSlug) {
    redirect(`/organizations/${organizationSlug}?tab=users`)
  }

  const { entries, organizations, showOrganizationColumn } = await getUsersHubData()
  const tintedEntries = assignZebraTints(entries)
  const gridClass = showOrganizationColumn ? 'us-data-row--cols-4' : 'us-data-row--cols-3'

  return (
    <Layout hideFooter hideHeader title="Users">
      <section className="space-y-4">
        <div className="us-panel flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {entries.length} user{entries.length === 1 ? '' : 's'}
            {showOrganizationColumn ? ' across your organizations' : ` in ${organizations[0]?.name ?? 'your organization'}`}.
          </p>
          <InviteUserPanel
            canCreateOrganization={isSuperAdminUser(currentUser)}
            canInviteAdmin={isSuperAdminUser(currentUser)}
            defaultOrganizationId={organizations.length === 1 ? organizations[0]?.id : undefined}
            hideOrganizationSelector={organizations.length === 1}
            organizations={organizations}
          />
        </div>

        {tintedEntries.length > 0 ? (
          <div className="us-panel overflow-hidden px-4 py-4">
            <div className={`us-data-row us-data-row-header ${gridClass} px-4`} style={{ color: 'var(--us-muted)' }}>
              <span className="us-data-row__lead">User</span>
              {showOrganizationColumn ? <span className="us-data-row__chips">Organization</span> : null}
              <span className={showOrganizationColumn ? 'us-data-row__detail' : 'us-data-row__chips'}>Role</span>
              <span className="us-data-row__actions">Action</span>
            </div>
            <TruncatedList as="ul" itemLabel="users" listClassName="space-y-2">
              {tintedEntries.map((entry) => (
                <UserHubRow
                  globalRole={entry.globalRole}
                  key={`${entry.userId}-${entry.organizationId ?? 'none'}`}
                  organizationName={entry.organizationName}
                  organizationSlug={entry.organizationSlug}
                  roleInOrganization={entry.roleInOrganization}
                  rowTint={entry.rowTint}
                  showOrganizationColumn={showOrganizationColumn}
                  userEmail={entry.userEmail}
                  userName={entry.userName}
                />
              ))}
            </TruncatedList>
          </div>
        ) : (
          <div className="us-panel px-6 py-6">
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No users are available yet.
            </p>
            {organizations.length > 0 ? (
              <Link className="mt-3 inline-block text-sm font-medium hover:underline" href="/organizations" style={{ color: 'var(--us-blue-dark)' }}>
                Open organizations
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </Layout>
  )
}

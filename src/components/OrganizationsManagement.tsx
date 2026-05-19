'use client'

import Link from 'next/link'

import { createOrganizationAction, deleteOrganizationAction, requestOrganizationMembershipAction } from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { TruncatedList } from '@/components/TruncatedList'

export type OrganizationSummary = {
  eventCount: number
  id: number
  name: string
  slug: string
}

type OrganizationsManagementProps = {
  isSuperAdmin: boolean
  organizationSummaries: OrganizationSummary[]
}

export function OrganizationsManagement({ isSuperAdmin, organizationSummaries }: OrganizationsManagementProps) {
  return (
    <div className="space-y-4">
      <article className="us-panel px-5 py-5 md:px-6 md:py-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Request organization access
        </h2>
        <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          Ask to join an organization by slug. An organization manager or super admin can approve your request on the Users
          page.
        </p>
        <form action={requestOrganizationMembershipAction} className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block flex-1 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Organization slug
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              name="organizationSlug"
              placeholder="default"
              required
              style={{ borderColor: 'var(--us-border)' }}
            />
          </label>
          <button className="us-button-secondary px-5 py-3 text-sm font-medium" type="submit">
            Submit request
          </button>
        </form>
      </article>

      {isSuperAdmin ? (
        <article className="us-panel px-5 py-5 md:px-6 md:py-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            Create organization
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Add a new organization for events, channels, and member access.
          </p>
          <form action={createOrganizationAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Name
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="name"
                required
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Slug
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="slug"
                placeholder="optional"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
              Create organization
            </button>
          </form>
        </article>
      ) : null}

      <article className="us-panel px-5 py-5 md:px-6 md:py-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Organizations
        </h2>
        <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          Open an organization on the Users page to manage members, invites, and join requests.
        </p>

        {organizationSummaries.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: 'var(--us-muted)' }}>
            No organizations yet.
            {isSuperAdmin ? ' Create one above to get started.' : null}
          </p>
        ) : (
          <TruncatedList as="ul" className="mt-4" itemLabel="organizations" listClassName="space-y-3">
            {organizationSummaries.map((organization) => (
              <li
                key={organization.id}
                className="flex flex-col gap-4 rounded-3xl border bg-white/75 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                style={{ borderColor: 'var(--us-border)' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                    {organization.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                    {organization.slug} · {organization.eventCount} event{organization.eventCount === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="us-button-secondary px-4 py-2.5 text-sm font-medium"
                    href={`/users?organization=${organization.slug}`}
                  >
                    Manage members
                  </Link>

                  {isSuperAdmin ? (
                    organization.eventCount > 0 ? (
                      <p className="text-xs" style={{ color: 'var(--us-muted)' }}>
                        Remove or reassign events before deleting.
                      </p>
                    ) : (
                      <form action={deleteOrganizationAction} id={`delete-organization-${organization.id}`}>
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <ConfirmSubmitButton
                          action={deleteOrganizationAction}
                          confirmMessage={`Delete ${organization.name}? All memberships for this organization will be removed. This cannot be undone.`}
                          formId={`delete-organization-${organization.id}`}
                          successUrl="/organizations"
                          title="Delete organization"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    )
                  ) : null}
                </div>
              </li>
            ))}
          </TruncatedList>
        )}
      </article>
    </div>
  )
}

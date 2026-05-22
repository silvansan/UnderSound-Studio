'use client'

import { useEffect, useState } from 'react'

import { inviteUserAction } from '@/app/users/actions'
import { SideDrawer } from '@/components/SideDrawer'
import type { Organization } from '@/payload-types'

const CREATE_ORGANIZATION_VALUE = 'new'

type InviteUserPanelProps = {
  canCreateOrganization?: boolean
  canInviteAdmin: boolean
  defaultOrganizationId?: number
  hideOrganizationSelector?: boolean
  organizations: Organization[]
}

export function InviteUserPanel({
  canCreateOrganization = false,
  canInviteAdmin,
  defaultOrganizationId,
  hideOrganizationSelector = false,
  organizations,
}: InviteUserPanelProps) {
  const [open, setOpen] = useState(false)
  const resolvedDefaultOrganizationId =
    defaultOrganizationId ?? organizations[0]?.id ?? CREATE_ORGANIZATION_VALUE
  const [organizationChoice, setOrganizationChoice] = useState(String(resolvedDefaultOrganizationId))
  const isCreatingOrganization = organizationChoice === CREATE_ORGANIZATION_VALUE

  useEffect(() => {
    if (open) {
      setOrganizationChoice(String(resolvedDefaultOrganizationId))
    }
  }, [open, resolvedDefaultOrganizationId])

  if (organizations.length === 0 && !canCreateOrganization) {
    return null
  }

  return (
    <>
      <button className="us-button-primary px-5 py-2.5 text-sm font-medium" onClick={() => setOpen(true)} type="button">
        Invite user
      </button>

      <SideDrawer
        description="Send an activation email and add someone to an organization."
        onClose={() => setOpen(false)}
        open={open}
        title="Invite user"
      >
        <form action={inviteUserAction} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Username
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              name="name"
              required
              style={{ borderColor: 'var(--us-border)' }}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Email
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              name="email"
              required
              style={{ borderColor: 'var(--us-border)' }}
              type="email"
            />
          </label>
          {hideOrganizationSelector ? (
            <input name="organizationId" type="hidden" value={resolvedDefaultOrganizationId} />
          ) : (
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              Organization
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="organizationId"
                onChange={(event) => setOrganizationChoice(event.target.value)}
                required
                style={{ borderColor: 'var(--us-border)' }}
                value={organizationChoice}
              >
                {canCreateOrganization ? (
                  <option value={CREATE_ORGANIZATION_VALUE}>Create new organization...</option>
                ) : null}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isCreatingOrganization ? (
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
              New organization name
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="newOrganizationName"
                placeholder="e.g. Riverside Community Church"
                required
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
          ) : null}
          <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Org role
            <select
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              defaultValue="moderator"
              name="roleInOrganization"
              style={{ borderColor: 'var(--us-border)' }}
            >
              <option value="manager">Manager</option>
              <option value="moderator">Moderator</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-muted)' }}>
            Platform role
            <select
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              name="role"
              style={{ borderColor: 'var(--us-border)' }}
            >
              {canInviteAdmin ? <option value="admin">Admin</option> : null}
              <option value="moderator">Moderator</option>
            </select>
          </label>
          <button className="us-button-primary w-full px-5 py-3 text-sm font-medium" type="submit">
            Send invite
          </button>
        </form>
      </SideDrawer>
    </>
  )
}

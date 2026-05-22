export type OrganizationOption = {
  id: number
  name: string
  slug?: string
}

type OrganizationSelectFieldProps = {
  defaultOrganizationId?: number
  labelClassName?: string
  name?: string
  organizations: OrganizationOption[]
  required?: boolean
  selectClassName?: string
}

export function OrganizationSelectField({
  defaultOrganizationId,
  labelClassName = 'block text-sm font-medium',
  name = 'organizationId',
  organizations,
  required = true,
  selectClassName = 'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none',
}: OrganizationSelectFieldProps) {
  if (organizations.length === 0) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
        No organizations are available. Create or join an organization first.
      </p>
    )
  }

  if (organizations.length === 1) {
    return <input name={name} type="hidden" value={organizations[0].id} />
  }

  const selectedOrganizationId = defaultOrganizationId ?? organizations[0]?.id

  return (
    <label className={labelClassName} style={{ color: 'var(--us-text)' }}>
      Organization
      <select
        className={selectClassName}
        defaultValue={selectedOrganizationId}
        name={name}
        required={required}
        style={{ borderColor: 'var(--us-border)' }}
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function relationshipOrganizationId(
  value: number | { id?: number | null } | null | undefined,
): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  return typeof value?.id === 'number' ? value.id : undefined
}

export function organizationIdFromEvent(event?: { organization?: number | { id?: number | null } | null }): number | undefined {
  return relationshipOrganizationId(event?.organization ?? undefined)
}

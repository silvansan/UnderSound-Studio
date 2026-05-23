import { EventForm } from '@/components/EventForm'
import { Layout } from '@/components/Layout'
import { createEventAction } from '@/app/events/actions'
import { getManageableOrganizations } from '@/lib/organization-data'
import { requireAppUser } from '@/lib/app-auth'
import { isAdminUser } from '@/lib/permissions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const user = await requireAppUser()

  if (!isAdminUser(user)) {
    notFound()
  }

  const organizations = await getManageableOrganizations()

  return (
    <Layout hideHeader title="Create event">
      <EventForm
        action={createEventAction}
        organizations={organizations}
        submitLabel="Create event"
      />
    </Layout>
  )
}

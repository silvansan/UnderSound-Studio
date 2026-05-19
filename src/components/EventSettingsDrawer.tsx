import { updateEventAction } from '@/app/events/actions'
import { EventAssignmentsSection } from '@/components/EventAssignmentsSection'
import { EventForm } from '@/components/EventForm'
import { PanelDrawer } from '@/components/PanelDrawer'
import type { Event, EventAssignment } from '@/payload-types'

type EventSettingsDrawerProps = {
  assignments: EventAssignment[]
  canManageAssignments: boolean
  defaultOpen?: boolean
  event: Event
}

export function EventSettingsDrawer({
  assignments,
  canManageAssignments,
  defaultOpen = false,
  event,
}: EventSettingsDrawerProps) {
  return (
    <PanelDrawer
      defaultOpen={defaultOpen}
      description="Event details, passwords, and team list."
      title="Settings"
    >
      <div className="space-y-6">
        <EventForm action={updateEventAction} event={event} submitLabel="Save event" variant="drawer" />
        <EventAssignmentsSection assignments={assignments} canManageAssignments={canManageAssignments} />
      </div>
    </PanelDrawer>
  )
}

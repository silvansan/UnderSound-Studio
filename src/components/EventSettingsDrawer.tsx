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
  organizations?: Array<{ id: number; name: string; slug?: string }>
}

export function EventSettingsDrawer({
  assignments,
  canManageAssignments,
  defaultOpen = false,
  event,
  organizations = [],
}: EventSettingsDrawerProps) {
  return (
    <PanelDrawer
      defaultOpen={defaultOpen}
      description="Event details, passwords, and team list."
      title="Settings"
    >
      <div className="space-y-6">
        <EventForm
          action={updateEventAction}
          event={event}
          organizations={organizations}
          submitLabel="Save event"
          variant="drawer"
        />
        <EventAssignmentsSection assignments={assignments} canManageAssignments={canManageAssignments} />
      </div>
    </PanelDrawer>
  )
}

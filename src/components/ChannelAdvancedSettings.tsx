import { updateChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelForm } from '@/components/ChannelForm'
import { PanelDrawer } from '@/components/PanelDrawer'
import type { Channel } from '@/payload-types'

type ChannelAdvancedSettingsProps = {
  channel: Channel
  defaultOpen?: boolean
  eventListenerPasswordConfigured: boolean
  eventSlug: string
}

export function ChannelAdvancedSettings({
  channel,
  defaultOpen = false,
  eventListenerPasswordConfigured,
  eventSlug,
}: ChannelAdvancedSettingsProps) {
  return (
    <PanelDrawer
      defaultOpen={defaultOpen}
      description="Listener/speaker access, passwords, WebRTC, HLS, and audio defaults."
      title="Advanced settings"
    >
      <ChannelForm
        action={updateChannelAction}
        channel={channel}
        eventListenerPasswordConfigured={eventListenerPasswordConfigured}
        eventSlug={eventSlug}
        submitLabel="Save settings"
        variant="advanced"
      />
    </PanelDrawer>
  )
}

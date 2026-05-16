import type { Channel } from '@/payload-types'

type ChannelFormProps = {
  action: (formData: FormData) => Promise<void>
  channel?: Channel
  eventSlug: string
  submitLabel: string
}

export function ChannelForm({ action, channel, eventSlug, submitLabel }: ChannelFormProps) {
  return (
    <form action={action} className="us-panel space-y-5 px-6 py-6">
      <input name="eventSlug" type="hidden" value={eventSlug} />
      {channel ? (
        <>
          <input name="id" type="hidden" value={channel.id} />
          <input name="originalSlug" type="hidden" value={channel.slug} />
        </>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Name
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.name ?? ''} name="name" required style={{ borderColor: 'var(--us-border)' }} />
        </label>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Slug
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.slug ?? ''} name="slug" style={{ borderColor: 'var(--us-border)' }} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Language code
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.languageCode ?? ''} name="languageCode" style={{ borderColor: 'var(--us-border)' }} />
        </label>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Language label
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.languageLabel ?? ''} name="languageLabel" style={{ borderColor: 'var(--us-border)' }} />
        </label>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Sort order
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.sortOrder ?? 0} name="sortOrder" style={{ borderColor: 'var(--us-border)' }} type="number" />
        </label>
      </div>

      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Description
        <textarea className="mt-2 min-h-24 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.description ?? ''} name="description" style={{ borderColor: 'var(--us-border)' }} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Listener token mode
          <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.listenerTokenMode ?? 'public'} name="listenerTokenMode" style={{ borderColor: 'var(--us-border)' }}>
            <option value="public">Public</option>
            <option value="password">Password</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Icecast fallback URL
          <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={channel?.icecastFallbackUrl ?? ''} name="icecastFallbackUrl" style={{ borderColor: 'var(--us-border)' }} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['enabled', 'Channel enabled', channel?.enabled ?? true],
          ['listenerPageEnabled', 'Listener page enabled', channel?.listenerPageEnabled ?? true],
          ['speakerPageEnabled', 'Speaker page enabled', channel?.speakerPageEnabled ?? true],
          ['webrtcEnabled', 'WebRTC enabled', channel?.webrtcEnabled ?? true],
          ['hlsEnabled', 'HLS enabled', channel?.hlsEnabled ?? false],
          ['speakerPasswordEnabled', 'Require channel speaker password', channel?.speakerPasswordEnabled ?? false],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
            <input className="mt-1" defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <button type="submit" className="us-button-primary px-5 py-3 text-sm font-medium">
        {submitLabel}
      </button>
    </form>
  )
}

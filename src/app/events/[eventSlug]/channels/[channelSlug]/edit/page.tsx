import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ channelSlug: string; eventSlug: string }>
}

export default async function EditChannelPage({ params }: PageProps) {
  const { channelSlug, eventSlug } = await params
  redirect(`/events/${eventSlug}/channels/${channelSlug}?settings=open`)
}

import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export default async function EventSettingsPage({ params }: PageProps) {
  const { eventSlug } = await params
  redirect(`/events/${eventSlug}?settings=open`)
}

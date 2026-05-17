import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventChannelsPage({ params }: PageProps) {
  const { eventSlug } = await params

  redirect(`/events/${eventSlug}`)
}

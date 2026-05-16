const baseUrl = () =>
  process.env.PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

export function getListenerUrl(eventSlug: string, channelSlug: string): string {
  return `${baseUrl()}/listen/${eventSlug}/${channelSlug}`
}

export function getSpeakerUrl(eventSlug: string, channelSlug: string): string {
  return `${baseUrl()}/speak/${eventSlug}/${channelSlug}`
}

export function getEventUrl(eventSlug: string): string {
  return `${baseUrl()}/events/${eventSlug}`
}

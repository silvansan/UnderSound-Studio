import type { PublicChannelContext } from '@/lib/public-channel'
import {
  createSpeakerSessionToken,
  hashSpeakerPassword,
  speakerSessionMaxAgeSeconds,
  verifySpeakerPassword,
  verifySpeakerSessionToken,
} from '@/lib/speaker-password'

export { hashSpeakerPassword as hashListenerPassword }

export function eventListenerPasswordConfigured(event: { listenerPasswordHash?: string | null } | null | undefined): boolean {
  return typeof event?.listenerPasswordHash === 'string' && event.listenerPasswordHash.length > 0
}

export function listenerPasswordRequired(context: PublicChannelContext): boolean {
  return (
    context.event.listenerPasswordEnabled === true ||
    context.channel.listenerTokenMode === 'password'
  )
}

export async function verifyContextListenerPassword(
  context: PublicChannelContext,
  password: string,
): Promise<boolean> {
  if (!listenerPasswordRequired(context)) {
    return true
  }

  return verifySpeakerPassword(password, context.event.listenerPasswordHash)
}

export function getListenerSessionCookieName(eventSlug: string, channelSlug: string): string {
  return `ablaut_listener_${eventSlug}_${channelSlug}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 48)
}

export function createListenerSessionToken(eventSlug: string, channelSlug: string): string {
  return createSpeakerSessionToken(eventSlug, channelSlug)
}

export function verifyListenerSessionToken(
  eventSlug: string,
  channelSlug: string,
  token: string | undefined,
): boolean {
  return verifySpeakerSessionToken(eventSlug, channelSlug, token)
}

export const listenerSessionMaxAgeSeconds = speakerSessionMaxAgeSeconds

/** Header for native/mobile clients that cannot rely on browser cookies. */
export const LISTENER_SESSION_HEADER = 'x-ablaut-listener-session'

export function getListenerAccessInfo(context: PublicChannelContext) {
  const required = listenerPasswordRequired(context)
  const configured = eventListenerPasswordConfigured(context.event)
  const mode = context.channel.listenerTokenMode ?? 'public'

  return {
    listenerPasswordConfigured: configured,
    listenerPasswordMissing: required && !configured,
    listenerPasswordRequired: required,
    listenerTokenMode: mode,
    listenerUnavailable: mode === 'private',
    verifyPasswordEndpoint: '/api/listener/verify-password',
  }
}

export function resolveListenerSessionToken(
  eventSlug: string,
  channelSlug: string,
  sources: {
    bodyToken?: string | null
    cookieToken?: string | null
    headerToken?: string | null
  },
): string | undefined {
  const token = sources.headerToken || sources.bodyToken || sources.cookieToken

  if (!token) {
    return undefined
  }

  return verifyListenerSessionToken(eventSlug, channelSlug, token) ? token : undefined
}

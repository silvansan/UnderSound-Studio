import { AccessToken } from 'livekit-server-sdk'
import { randomUUID } from 'node:crypto'

type LiveKitTokenResponse = {
  expiresIn: number
  roomName: string
  token: string
  url: string
}

function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim()
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim()
  const url = normalizeLiveKitURL(process.env.LIVEKIT_URL?.trim())

  if (!apiKey || !apiSecret || !url) {
    throw new Error('LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL.')
  }

  return { apiKey, apiSecret, url }
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function normalizeLiveKitURL(url: string | undefined): string | undefined {
  if (!url) {
    return undefined
  }

  if (url.startsWith('https://')) {
    return `wss://${url.slice('https://'.length)}`
  }

  if (url.startsWith('http://')) {
    return `ws://${url.slice('http://'.length)}`
  }

  return url
}

export function getBrowserLiveKitURL(request: Request): string | undefined {
  const configuredUrl = normalizeLiveKitURL(process.env.LIVEKIT_URL?.trim())

  if (!configuredUrl) {
    return undefined
  }

  const liveKitUrl = new URL(configuredUrl)

  if (!isLocalHost(liveKitUrl.hostname)) {
    return configuredUrl
  }

  const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host')

  if (!requestHost) {
    return configuredUrl
  }

  const appHost = requestHost.split(':')[0]
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const protocol = forwardedProto === 'https' ? 'wss:' : liveKitUrl.protocol

  liveKitUrl.hostname = appHost
  liveKitUrl.protocol = protocol

  return liveKitUrl.toString().replace(/\/$/, '')
}

export function getLiveKitRoomName(eventSlug: string, channelSlug: string): string {
  return `ablaut_${eventSlug}_${channelSlug}`
}

export function createLiveKitIdentity(prefix: 'listener' | 'speaker'): string {
  return `${prefix}_${randomUUID()}`
}

export async function createListenerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
  browserUrl?: string,
): Promise<LiveKitTokenResponse> {
  const { apiKey, apiSecret, url } = getLiveKitConfig()
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: ttlSeconds,
  })
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish: false,
  })

  return {
    expiresIn: ttlSeconds,
    roomName,
    token: await token.toJwt(),
    url: browserUrl ?? url,
  }
}

export async function createSpeakerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
  canSubscribe = true,
  browserUrl?: string,
): Promise<LiveKitTokenResponse> {
  const { apiKey, apiSecret, url } = getLiveKitConfig()
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: ttlSeconds,
  })
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe,
    canPublish: true,
    canPublishData: true,
  })

  return {
    expiresIn: ttlSeconds,
    roomName,
    token: await token.toJwt(),
    url: browserUrl ?? url,
  }
}

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

export function getLiveKitConfigOrNull():
  | {
      apiKey: string
      apiSecret: string
      url: string
    }
  | null {
  try {
    return getLiveKitConfig()
  } catch {
    return null
  }
}

export function getLiveKitHttpUrl(wsUrl: string): string {
  return wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://').replace(/\/$/, '')
}

export function logLiveKitBrowserUrlResolution(request: Request, configuredPublicUrl?: string | null): void {
  const browserUrl = getBrowserLiveKitURL(request, configuredPublicUrl)

  if (browserUrl) {
    console.info(`[ablaut] LiveKit browser URL resolved: ${browserUrl}`)
    return
  }

  console.warn('[ablaut] LiveKit browser URL could not be resolved for this request.')
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function getRequestHost(request: Request): string | null {
  const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host')

  return requestHost?.split(':')[0] ?? null
}

function rewriteLocalhostLiveKitUrlForRequest(url: string, request: Request): string {
  const appHost = getRequestHost(request)

  if (!appHost || isLocalHost(appHost)) {
    return url
  }

  try {
    const liveKitUrl = new URL(url)

    if (!isLocalHost(liveKitUrl.hostname)) {
      return url.replace(/\/$/, '')
    }

    liveKitUrl.hostname = appHost

    return liveKitUrl.toString().replace(/\/$/, '')
  } catch {
    return url
  }
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

export function getBrowserLiveKitURL(
  request: Request,
  configuredPublicUrl?: string | null,
): string | undefined {
  const explicitPublic =
    normalizeLiveKitURL(configuredPublicUrl?.trim()) ??
    normalizeLiveKitURL(process.env.LIVEKIT_PUBLIC_URL?.trim())

  if (explicitPublic) {
    return rewriteLocalhostLiveKitUrlForRequest(explicitPublic, request)
  }

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

  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (forwardedProto === 'https') {
    return undefined
  }

  return rewriteLocalhostLiveKitUrlForRequest(configuredUrl, request)
}

export function getLiveKitBrowserUrlErrorMessage(): string {
  return 'LiveKit browser URL is not configured. Set LIVEKIT_PUBLIC_URL or LIVEKIT_URL to a WebSocket URL reachable from the browser (for HTTPS deployments, use wss:// on your LiveKit domain). You can also set the LiveKit public URL in Settings.'
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

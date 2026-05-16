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
  const url = process.env.LIVEKIT_URL?.trim()

  if (!apiKey || !apiSecret || !url) {
    throw new Error('LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL.')
  }

  return { apiKey, apiSecret, url }
}

export function getLiveKitRoomName(eventSlug: string, channelSlug: string): string {
  return `undersound_${eventSlug}_${channelSlug}`
}

export function createLiveKitIdentity(prefix: 'listener' | 'speaker'): string {
  return `${prefix}_${randomUUID()}`
}

export async function createListenerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
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
    url,
  }
}

export async function createSpeakerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
  canSubscribe = true,
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
    url,
  }
}

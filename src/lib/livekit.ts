import { AccessToken } from 'livekit-server-sdk'

const apiKey = () => process.env.LIVEKIT_API_KEY || ''
const apiSecret = () => process.env.LIVEKIT_API_SECRET || ''
const livekitUrl = () => process.env.LIVEKIT_URL || ''

export function getLiveKitRoomName(eventSlug: string, channelSlug: string): string {
  return `undersound_${eventSlug}_${channelSlug}`
}

export async function createListenerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
): Promise<{ token: string; url: string }> {
  const token = new AccessToken(apiKey(), apiSecret(), {
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
    token: await token.toJwt(),
    url: livekitUrl(),
  }
}

export async function createSpeakerToken(
  roomName: string,
  identity: string,
  ttlSeconds = 3600,
): Promise<{ token: string; url: string }> {
  const token = new AccessToken(apiKey(), apiSecret(), {
    identity,
    ttl: ttlSeconds,
  })
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
  })

  return {
    token: await token.toJwt(),
    url: livekitUrl(),
  }
}

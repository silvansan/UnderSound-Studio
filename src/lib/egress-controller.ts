import configPromise from '@payload-config'
import { EgressStatus } from '@livekit/protocol'
import { EgressClient, RoomServiceClient, SegmentedFileOutput, TrackType } from 'livekit-server-sdk'
import { getPayload } from 'payload'

import {
  buildHlsManifestUrl,
  resolveHlsPlaylistName,
  resolveHlsPublicBaseUrl,
  resolveHlsSegmentDuration,
} from '@/lib/streaming/build-hls-url'
import { clearChannelHlsDirectory, hlsManifestHasPlayableSegments, hlsManifestExists } from '@/lib/streaming/hls-manifest-server'
import { getHlsEgressOutputDirectory, isHlsEgressEnabled } from '@/lib/streaming/egress-config'
import { getLiveKitConfigOrNull, getLiveKitHttpUrl } from '@/lib/livekit'
import type { Channel, Event, SiteSetting } from '@/payload-types'

type LiveKitCredentials = {
  apiKey: string
  apiSecret: string
  url: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isRoomMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as { code?: string }).code

  return (
    code === 'not_found' ||
    error.message.toLowerCase().includes('room does not exist') ||
    error.message.toLowerCase().includes('requested room does not exist')
  )
}

function createRoomService(livekit: LiveKitCredentials): RoomServiceClient {
  return new RoomServiceClient(getLiveKitHttpUrl(livekit.url), livekit.apiKey, livekit.apiSecret)
}

async function liveKitRoomExists(roomName: string, livekit: LiveKitCredentials): Promise<boolean> {
  const rooms = await createRoomService(livekit).listRooms([roomName])

  return rooms.some((room) => room.name === roomName)
}

async function findSpeakerAudioTrackId(roomName: string, livekit: LiveKitCredentials): Promise<string | null> {
  const participants = await createRoomService(livekit).listParticipants(roomName)

  for (const participant of participants) {
    if (!participant.identity.startsWith('speaker_')) {
      continue
    }

    for (const track of participant.tracks) {
      if (track.type === TrackType.AUDIO && track.sid) {
        return track.sid
      }
    }
  }

  for (const participant of participants) {
    if (participant.identity.startsWith('listener_')) {
      continue
    }

    for (const track of participant.tracks) {
      if (track.type === TrackType.AUDIO && track.sid) {
        return track.sid
      }
    }
  }

  return null
}

async function isTrackPublishedInRoom(
  roomName: string,
  livekit: LiveKitCredentials,
  trackId: string,
): Promise<boolean> {
  const participants = await createRoomService(livekit).listParticipants(roomName)

  for (const participant of participants) {
    for (const track of participant.tracks) {
      if (track.sid === trackId) {
        return true
      }
    }
  }

  return false
}

async function resolveSpeakerAudioTrackId(
  roomName: string,
  livekit: LiveKitCredentials,
  preferredTrackId?: string | null,
): Promise<string | null> {
  if (preferredTrackId && (await isTrackPublishedInRoom(roomName, livekit, preferredTrackId))) {
    return preferredTrackId
  }

  const discoveredTrackId = await findSpeakerAudioTrackId(roomName, livekit)

  if (preferredTrackId && discoveredTrackId && preferredTrackId !== discoveredTrackId) {
    console.warn(
      `[ablaut] Speaker track ${preferredTrackId} is stale in "${roomName}"; using ${discoveredTrackId}.`,
    )
  }

  return discoveredTrackId
}

async function waitForLiveKitRoom(
  roomName: string,
  livekit: LiveKitCredentials,
  attempts = 20,
  delayMs = 1000,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await liveKitRoomExists(roomName, livekit)) {
      return true
    }

    await sleep(delayMs)
  }

  return false
}

async function waitForSpeakerAudioTrack(
  roomName: string,
  livekit: LiveKitCredentials,
  preferredTrackId?: string | null,
  attempts = 15,
  delayMs = 1000,
): Promise<string | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const trackId = await resolveSpeakerAudioTrackId(roomName, livekit, preferredTrackId)

    if (trackId) {
      return trackId
    }

    await sleep(delayMs)
  }

  return null
}

type EgressLaunchOutcome = 'live' | 'failed' | 'timeout'

async function waitForEgressLaunchOutcome(
  egressClient: EgressClient,
  egressId: string,
  eventSlug: string,
  channelSlug: string,
  settings?: SiteSetting | null,
  attempts = 45,
  delayMs = 1000,
): Promise<EgressLaunchOutcome> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await hlsManifestHasPlayableSegments(eventSlug, channelSlug, settings)) {
      return 'live'
    }

    const egressJobs = await egressClient.listEgress({ egressId })
    const egressInfo = egressJobs.find((job) => job.egressId === egressId)

    if (egressInfo?.status === EgressStatus.EGRESS_FAILED) {
      return 'failed'
    }

    await sleep(delayMs)
  }

  return 'timeout'
}

async function updateChannelEgressState(
  channelID: number,
  data: Pick<Channel, 'hlsEgressId' | 'hlsEgressStatus' | 'hlsPlaybackUrl'>,
) {
  const payload = await getPayload({ config: configPromise })

  await payload.update({
    id: channelID,
    collection: 'channels',
    data,
    overrideAccess: true,
  })
}

export async function ensureChannelHlsEgress(
  channel: Channel,
  event: Event,
  roomName: string,
  settings?: SiteSetting | null,
  options?: {
    audioTrackId?: string | null
  },
): Promise<void> {
  if (!isHlsEgressEnabled() || channel.hlsEnabled !== true) {
    return
  }

  const livekit = getLiveKitConfigOrNull()

  if (!livekit) {
    return
  }

  const manifestReady = await hlsManifestExists(event.slug, channel.slug, settings)

  if ((channel.hlsEgressStatus === 'live' || channel.hlsEgressStatus === 'starting') && manifestReady) {
    return
  }

  if ((channel.hlsEgressStatus === 'live' || channel.hlsEgressStatus === 'starting') && !manifestReady) {
    console.warn(`[ablaut] LL-HLS egress for ${event.slug}/${channel.slug} is stale; restarting.`)
    await stopChannelHlsEgress(channel)
    channel = {
      ...channel,
      hlsEgressId: null,
      hlsEgressStatus: 'idle',
    }
  }

  const payload = await getPayload({ config: configPromise })
  const hlsPublicBaseUrl = resolveHlsPublicBaseUrl(settings)
  const playlistName = resolveHlsPlaylistName(settings)
  const hlsPlaybackUrl = buildHlsManifestUrl(event.slug, channel.slug, hlsPublicBaseUrl, playlistName)
  const egressOutputDirectory = getHlsEgressOutputDirectory()
  const filenamePrefix = `${egressOutputDirectory}/${event.slug}/${channel.slug}/`

  const roomReady = await waitForLiveKitRoom(roomName, livekit)

  if (!roomReady) {
    console.warn(`[ablaut] LiveKit room "${roomName}" is not ready yet; deferring LL-HLS egress start.`)

    await updateChannelEgressState(channel.id, {
      hlsEgressId: channel.hlsEgressId,
      hlsEgressStatus: 'idle',
      hlsPlaybackUrl: hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
    })

    return
  }

  const audioTrackId = await waitForSpeakerAudioTrack(roomName, livekit, options?.audioTrackId)

  if (!audioTrackId) {
    console.warn(`[ablaut] No speaker audio track in "${roomName}" yet; deferring LL-HLS egress start.`)

    await updateChannelEgressState(channel.id, {
      hlsEgressId: channel.hlsEgressId,
      hlsEgressStatus: 'idle',
      hlsPlaybackUrl: hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
    })

    return
  }

  const verifiedTrackId = await resolveSpeakerAudioTrackId(roomName, livekit, audioTrackId)

  if (!verifiedTrackId) {
    console.warn(`[ablaut] Speaker audio track disappeared from "${roomName}" before LL-HLS egress start.`)

    await updateChannelEgressState(channel.id, {
      hlsEgressId: channel.hlsEgressId,
      hlsEgressStatus: 'idle',
      hlsPlaybackUrl: hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
    })

    return
  }

  await updateChannelEgressState(channel.id, {
    hlsEgressId: channel.hlsEgressId,
    hlsEgressStatus: 'starting',
    hlsPlaybackUrl: hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
  })

  try {
    const egressClient = new EgressClient(getLiveKitHttpUrl(livekit.url), livekit.apiKey, livekit.apiSecret)
    const segmentOutput = new SegmentedFileOutput({
      filenamePrefix,
      playlistName: 'index.m3u8',
      segmentDuration: resolveHlsSegmentDuration(settings),
      livePlaylistName: 'index.live.m3u8',
    })

    const info = await egressClient.startTrackCompositeEgress(roomName, segmentOutput, {
      audioTrackId: verifiedTrackId,
    })

    const launchOutcome = await waitForEgressLaunchOutcome(
      egressClient,
      info.egressId,
      event.slug,
      channel.slug,
      settings,
    )

    await payload.update({
      id: channel.id,
      collection: 'channels',
      data: {
        hlsEgressId: launchOutcome === 'live' ? info.egressId : null,
        hlsEgressStatus: launchOutcome === 'live' ? 'live' : launchOutcome === 'failed' ? 'error' : 'starting',
        hlsPlaybackUrl: launchOutcome === 'live' ? hlsPlaybackUrl ?? channel.hlsPlaybackUrl : hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
      },
      overrideAccess: true,
    })

    if (launchOutcome === 'failed') {
      console.error(
        `[ablaut] LL-HLS egress ${info.egressId} failed for ${event.slug}/${channel.slug}.`,
      )
    } else if (launchOutcome === 'timeout') {
      console.warn(
        `[ablaut] LL-HLS egress ${info.egressId} started for ${event.slug}/${channel.slug}, but manifest is not ready yet.`,
      )
    }
  } catch (error) {
    console.error('[ablaut] Failed to start HLS egress', error)

    await updateChannelEgressState(channel.id, {
      hlsEgressId: channel.hlsEgressId,
      hlsEgressStatus: isRoomMissingError(error) ? 'idle' : 'error',
      hlsPlaybackUrl: hlsPlaybackUrl ?? channel.hlsPlaybackUrl,
    })
  }
}

function isFailedEgressStopError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('egress_failed') ||
    message.includes('cannot be stopped') ||
    message.includes('egress complete') ||
    message.includes('not found')
  )
}

export async function restartChannelHlsEgress(
  channel: Channel,
  event: Event,
  roomName: string,
  settings?: SiteSetting | null,
  options?: {
    audioTrackId?: string | null
  },
): Promise<Pick<Channel, 'hlsEgressStatus' | 'hlsPlaybackUrl'>> {
  if (!isHlsEgressEnabled() || channel.hlsEnabled !== true) {
    return {
      hlsEgressStatus: channel.hlsEgressStatus ?? 'idle',
      hlsPlaybackUrl: channel.hlsPlaybackUrl ?? null,
    }
  }

  await stopChannelHlsEgress(channel)
  await clearChannelHlsDirectory(event.slug, channel.slug)

  const resetChannel: Channel = {
    ...channel,
    hlsEgressId: null,
    hlsEgressStatus: 'idle',
    hlsPlaybackUrl: null,
  }

  await ensureChannelHlsEgress(resetChannel, event, roomName, settings, options)

  const payload = await getPayload({ config: configPromise })
  const refreshed = await payload.findByID({
    id: channel.id,
    collection: 'channels',
    overrideAccess: true,
  })

  return {
    hlsEgressStatus: refreshed.hlsEgressStatus ?? 'idle',
    hlsPlaybackUrl: refreshed.hlsPlaybackUrl ?? null,
  }
}

export async function stopChannelHlsEgress(channel: Pick<Channel, 'hlsEgressId' | 'id'>): Promise<void> {
  if (!isHlsEgressEnabled() || !channel.hlsEgressId) {
    return
  }

  const livekit = getLiveKitConfigOrNull()

  if (!livekit) {
    return
  }

  try {
    const egressClient = new EgressClient(getLiveKitHttpUrl(livekit.url), livekit.apiKey, livekit.apiSecret)
    await egressClient.stopEgress(channel.hlsEgressId)
  } catch (error) {
    if (!isFailedEgressStopError(error)) {
      console.warn('[ablaut] Failed to stop HLS egress', error)
    }
  }

  await updateChannelEgressState(channel.id, {
    hlsEgressId: null,
    hlsEgressStatus: 'idle',
    hlsPlaybackUrl: null,
  })
}

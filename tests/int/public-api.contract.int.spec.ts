import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { PublicChannelResponse, PublicEventDirectoryResponse } from '@/lib/public-channel'

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))

function readFixture<T>(filename: string): T {
  const raw = readFileSync(path.join(fixtureDir, '..', 'fixtures', filename), 'utf8')
  return JSON.parse(raw) as T
}

const requiredPublicChannelKeys = {
  access: [
    'listenerTokenMode',
    'listenerPasswordRequired',
    'listenerPasswordConfigured',
    'listenerPasswordMissing',
    'listenerUnavailable',
    'verifyPasswordEndpoint',
  ],
  event: ['title', 'slug', 'status', 'defaultLanguage', 'publicListenerEnabled', 'listenerPasswordEnabled', 'speakerPasswordEnabled'],
  channel: [
    'name',
    'slug',
    'languageCode',
    'languageLabel',
    'enabled',
    'listenerPageEnabled',
    'speakerPageEnabled',
    'listenerTokenMode',
    'speakerPasswordEnabled',
    'webrtcEnabled',
    'hlsEnabled',
    'hlsUrl',
    'icecastFallbackUrl',
    'recommendedTransport',
    'transportStatus',
  ],
  livekit: ['roomName', 'tokenEndpoint', 'url'],
} as const

describe('public API contract fixtures', () => {
  it('matches the mobile listener channel response shape', () => {
    const fixture = readFixture<PublicChannelResponse>('public-listen-channel.fixture.json')

    for (const key of requiredPublicChannelKeys.access) {
      expect(fixture.access).toHaveProperty(key)
    }

    for (const key of requiredPublicChannelKeys.event) {
      expect(fixture.event).toHaveProperty(key)
    }

    for (const key of requiredPublicChannelKeys.channel) {
      expect(fixture.channel).toHaveProperty(key)
    }

    for (const key of requiredPublicChannelKeys.livekit) {
      expect(fixture.livekit).toHaveProperty(key)
    }

    expect(fixture.livekit.tokenEndpoint).toBe('/api/livekit/listener-token')
    expect(fixture.access.verifyPasswordEndpoint).toBe('/api/listener/verify-password')
    expect(typeof fixture.channel.hlsUrl === 'string' || fixture.channel.hlsUrl === null).toBe(true)
  })

  it('matches the mobile event directory response shape', () => {
    const fixture = readFixture<PublicEventDirectoryResponse>('public-listen-event-directory.fixture.json')

    expect(fixture.event.slug).toBeTruthy()
    expect(fixture.event.title).toBeTruthy()
    expect(fixture.access.verifyPasswordEndpoint).toBe('/api/listener/verify-password')
    expect(Array.isArray(fixture.channels)).toBe(true)
    expect(fixture.channels.length).toBeGreaterThan(0)

    const channel = fixture.channels[0]
    expect(channel.slug).toBeTruthy()
    expect(channel.name).toBeTruthy()
    expect(channel.listenerUrl).toMatch(/^https:\/\//)
  })
})

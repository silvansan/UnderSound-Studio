import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import type { PublicChannelContext } from '@/lib/public-channel'

const scrypt = promisify(scryptCallback)
const HASH_PREFIX = 'scrypt'
const KEY_LENGTH = 64
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

function getSecret(): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required for speaker password sessions.')
  }

  return secret
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function getSpeakerSessionCookieName(eventSlug: string, channelSlug: string): string {
  return `undersound_speaker_${digest(`${eventSlug}:${channelSlug}`).slice(0, 24)}`
}

export function speakerPasswordRequired(context: PublicChannelContext): boolean {
  return context.event.speakerPasswordEnabled === true || context.channel.speakerPasswordEnabled === true
}

export async function hashSpeakerPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

  return `${HASH_PREFIX}$${salt}$${key.toString('hex')}`
}

export async function verifySpeakerPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    return false
  }

  const [prefix, salt, storedKey] = hash.split('$')

  if (prefix !== HASH_PREFIX || !salt || !storedKey) {
    return false
  }

  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

  return safeEqual(key.toString('hex'), storedKey)
}

export async function verifyContextSpeakerPassword(context: PublicChannelContext, password: string): Promise<boolean> {
  if (context.channel.speakerPasswordEnabled === true) {
    return verifySpeakerPassword(password, context.channel.speakerPasswordHash)
  }

  if (context.event.speakerPasswordEnabled === true) {
    return verifySpeakerPassword(password, context.event.speakerPasswordHash)
  }

  return true
}

export function createSpeakerSessionToken(eventSlug: string, channelSlug: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const payload = `${eventSlug}:${channelSlug}:${expiresAt}`
  const signature = sign(payload)

  return `${expiresAt}.${signature}`
}

export function verifySpeakerSessionToken(eventSlug: string, channelSlug: string, token: string | undefined): boolean {
  if (!token) {
    return false
  }

  const [expiresAtValue, signature] = token.split('.')
  const expiresAt = Number(expiresAtValue)

  if (!Number.isFinite(expiresAt) || !signature || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false
  }

  return safeEqual(sign(`${eventSlug}:${channelSlug}:${expiresAt}`), signature)
}

export const speakerSessionMaxAgeSeconds = SESSION_MAX_AGE_SECONDS

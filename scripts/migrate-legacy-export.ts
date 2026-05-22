import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

process.env.PAYLOAD_MIGRATING = 'true'

type OldStatus = 'active' | 'archived' | 'draft'

type OldChannel = {
  description?: unknown
  enabled?: unknown
  eventId?: unknown
  eventSlug?: unknown
  hlsEnabled?: unknown
  icecastFallbackUrl?: unknown
  id?: unknown
  languageCode?: unknown
  languageLabel?: unknown
  listenerPageEnabled?: unknown
  listenerTokenMode?: unknown
  livekitRoomName?: unknown
  name?: unknown
  roomName?: unknown
  slug?: unknown
  speakerPageEnabled?: unknown
  speakerPassword?: unknown
  speakerPasswordHash?: unknown
  title?: unknown
  webrtcEnabled?: unknown
}

type OldEvent = {
  channels?: unknown
  dateEnd?: unknown
  dateStart?: unknown
  defaultLanguage?: unknown
  description?: unknown
  id?: unknown
  listenerPassword?: unknown
  listenerPasswordHash?: unknown
  location?: unknown
  logo?: unknown
  publicListenerEnabled?: unknown
  slug?: unknown
  speakerPassword?: unknown
  speakerPasswordHash?: unknown
  status?: unknown
  title?: unknown
  name?: unknown
}

type OldSettings = {
  publicBaseUrl?: unknown
  siteName?: unknown
  supportEmail?: unknown
}

type OldExport = {
  channels?: unknown
  events?: unknown
  settings?: unknown
  users?: unknown
}

type CliOptions = {
  dryRun: boolean
  input: string
  uploadsDir?: string
}

type ImportedEventRef = {
  id: number
  slug: string
  title: string
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const inputIndex = args.findIndex((arg) => arg === '--input' || arg === '-i')
  const uploadsDirIndex = args.findIndex((arg) => arg === '--uploads-dir')
  const input = inputIndex >= 0 ? args[inputIndex + 1] : undefined

  if (!input) {
    throw new Error('Usage: payload run scripts/migrate-legacy-export.ts -- --input old-export.json [--dry-run] [--uploads-dir ./old-uploads]')
  }

  return {
    dryRun: args.includes('--dry-run'),
    input,
    uploadsDir: uploadsDirIndex >= 0 ? args[uploadsDirIndex + 1] : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function statusValue(value: unknown): OldStatus {
  return value === 'active' || value === 'archived' || value === 'draft' ? value : 'draft'
}

function listenerTokenModeValue(value: unknown): 'password' | 'private' | 'public' {
  return value === 'password' || value === 'private' ? value : 'public'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function eventTitle(event: OldEvent): string {
  return stringValue(event.title) ?? stringValue(event.name) ?? 'Untitled event'
}

function channelName(channel: OldChannel): string {
  return stringValue(channel.name) ?? stringValue(channel.title) ?? 'Untitled channel'
}

function normalizeExport(value: unknown): OldExport {
  if (Array.isArray(value)) {
    return { events: value }
  }

  if (!isRecord(value)) {
    throw new Error('Old export must be a JSON object or an array of events.')
  }

  return value
}

function oldIDKey(value: unknown): string | undefined {
  const stringID = stringValue(value)
  const numericID = numberValue(value)

  return stringID ?? (numericID === undefined ? undefined : String(numericID))
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveOldAssetPath(rawPath: unknown, inputFile: string, uploadsDir?: string) {
  const logoPath = stringValue(rawPath)

  if (!logoPath) {
    return undefined
  }

  const candidates = [
    path.isAbsolute(logoPath) ? logoPath : path.resolve(path.dirname(inputFile), logoPath),
    uploadsDir ? path.resolve(uploadsDir, logoPath) : undefined,
    uploadsDir ? path.resolve(uploadsDir, path.basename(logoPath)) : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate
    }
  }

  return undefined
}

const options = parseArgs()
const inputPath = path.resolve(options.input)
const inputJson = JSON.parse(await readFile(inputPath, 'utf8')) as unknown
const oldExport = normalizeExport(inputJson)
const oldEvents = asArray<OldEvent>(oldExport.events)
const oldTopLevelChannels = asArray<OldChannel>(oldExport.channels)
const oldSettings = isRecord(oldExport.settings) ? (oldExport.settings as OldSettings) : undefined

const { default: configPromise } = await import('@payload-config')
const payload = await getPayload({ config: configPromise })

const importedEvents = new Map<string, ImportedEventRef>()
const warnings: string[] = []

try {
  if (oldExport.users) {
    warnings.push('Old users were not imported. Invite users again or force password resets before enabling old accounts.')
  }

  if (oldSettings && !options.dryRun) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        publicBaseUrl: stringValue(oldSettings.publicBaseUrl),
        siteName: stringValue(oldSettings.siteName),
        supportEmail: stringValue(oldSettings.supportEmail),
      },
      overrideAccess: true,
    })
  }

  for (const oldEvent of oldEvents) {
    const title = eventTitle(oldEvent)
    const slug = slugify(stringValue(oldEvent.slug) ?? title)
    const oldLogoPath = await resolveOldAssetPath(oldEvent.logo, inputPath, options.uploadsDir)

    if (oldEvent.listenerPassword || oldEvent.listenerPasswordHash || oldEvent.speakerPassword || oldEvent.speakerPasswordHash) {
      warnings.push(`Skipped old password fields for event "${title}". Recreate listener/speaker passwords in ablaut.`)
    }

    let eventLogo: number | undefined

    if (oldLogoPath && !options.dryRun) {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: `${title} logo`,
        },
        filePath: oldLogoPath,
        overrideAccess: true,
      })

      eventLogo = media.id
    }

    const existing = await payload.find({
      collection: 'events',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const eventData = {
      dateEnd: stringValue(oldEvent.dateEnd),
      dateStart: stringValue(oldEvent.dateStart),
      defaultLanguage: stringValue(oldEvent.defaultLanguage) ?? 'en',
      description: stringValue(oldEvent.description),
      eventLogo,
      location: stringValue(oldEvent.location),
      publicListenerEnabled: booleanValue(oldEvent.publicListenerEnabled, true),
      slug,
      status: statusValue(oldEvent.status),
      title,
    }

    const event = options.dryRun
      ? ({ id: 0, slug, title } satisfies ImportedEventRef)
      : existing.docs[0]
        ? await payload.update({
            id: existing.docs[0].id,
            collection: 'events',
            data: eventData,
            overrideAccess: true,
          })
        : await payload.create({
            collection: 'events',
            data: eventData,
            overrideAccess: true,
          })

    const ref = { id: event.id, slug: event.slug, title: event.title }

    importedEvents.set(slug, ref)
    const oldEventID = oldIDKey(oldEvent.id)

    if (oldEventID) {
      importedEvents.set(oldEventID, ref)
    }

    for (const oldChannel of asArray<OldChannel>(oldEvent.channels)) {
      await importChannel(oldChannel, ref)
    }
  }

  for (const oldChannel of oldTopLevelChannels) {
    const eventKey = oldIDKey(oldChannel.eventSlug) ?? oldIDKey(oldChannel.eventId)
    const event = eventKey ? importedEvents.get(eventKey) : undefined

    if (!event) {
      warnings.push(`Skipped channel "${channelName(oldChannel)}" because its event could not be matched.`)
      continue
    }

    await importChannel(oldChannel, event)
  }

  console.log(options.dryRun ? 'Dry run complete.' : 'Migration complete.')
  console.log(`Events seen: ${oldEvents.length}`)
  console.log(`Top-level channels seen: ${oldTopLevelChannels.length}`)

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`)
  }
} finally {
  await payload.destroy()
}

async function importChannel(oldChannel: OldChannel, event: ImportedEventRef) {
  const name = channelName(oldChannel)
  const slug = slugify(stringValue(oldChannel.slug) ?? name)

  if (oldChannel.speakerPassword || oldChannel.speakerPasswordHash) {
    warnings.push(`Skipped old speaker password fields for channel "${name}". Recreate speaker passwords in ablaut.`)
  }

  if (options.dryRun) {
    return
  }

  const existing = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          slug: {
            equals: slug,
          },
        },
      ],
    },
  })

  const data = {
    description: stringValue(oldChannel.description),
    enabled: booleanValue(oldChannel.enabled, true),
    event: event.id,
    hlsEnabled: booleanValue(oldChannel.hlsEnabled, true),
    icecastFallbackUrl: stringValue(oldChannel.icecastFallbackUrl),
    languageCode: stringValue(oldChannel.languageCode),
    languageLabel: stringValue(oldChannel.languageLabel),
    listenerPageEnabled: booleanValue(oldChannel.listenerPageEnabled, true),
    listenerTokenMode: listenerTokenModeValue(oldChannel.listenerTokenMode),
    livekitRoomName: stringValue(oldChannel.livekitRoomName) ?? stringValue(oldChannel.roomName),
    name,
    roomName: stringValue(oldChannel.roomName) ?? stringValue(oldChannel.livekitRoomName),
    slug,
    speakerPageEnabled: booleanValue(oldChannel.speakerPageEnabled, true),
    sortOrder: numberValue(oldChannel.id) ?? 0,
    webrtcEnabled: booleanValue(oldChannel.webrtcEnabled, true),
  }

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'channels',
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'channels',
      data,
      overrideAccess: true,
    })
  }
}

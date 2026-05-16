import type { Payload } from 'payload'

import type { User } from '@/payload-types'

type AuditLogArgs = {
  action: string
  channel?: number | string | null
  collection?: string
  documentId?: number | string | null
  event?: number | string | null
  metadata?: Record<string, unknown>
  user?: User | null
}

function idValue(value: number | string | null | undefined): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export async function writeAuditLog(payload: Payload, args: AuditLogArgs): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: args.action,
        channel: idValue(args.channel),
        collection: args.collection,
        documentId: args.documentId ? String(args.documentId) : undefined,
        event: idValue(args.event),
        metadata: args.metadata,
        user: idValue(args.user?.id),
      },
      overrideAccess: true,
    })
  } catch (error) {
    console.warn('Failed to write audit log', error)
  }
}

import { config as loadEnv } from 'dotenv'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

loadEnv()

import { AuditLogs } from './collections/AuditLogs'
import { Channels } from './collections/Channels'
import { EventAssignments } from './collections/EventAssignments'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { OrganizationMemberships } from './collections/OrganizationMemberships'
import { Organizations } from './collections/Organizations'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { runStartupBootstrap } from './lib/bootstrap'
import { buildEmailAdapter } from './lib/email'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUri = process.env.DATABASE_URI || ''
const useSqlite =
  process.env.PAYLOAD_DATABASE === 'sqlite' || databaseUri.startsWith('file:')
const pushDatabaseSchema = process.env.PAYLOAD_DB_PUSH !== 'false'
const isProductionBuild =
  process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build'

async function removeDevMigrationMarker() {
  if (useSqlite || process.env.NODE_ENV !== 'production' || isProductionBuild || !databaseUri) {
    return
  }

  const { Client } = await import('pg')
  const client = new Client({ connectionString: databaseUri })

  try {
    await client.connect()

    const tableCheck = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'payload_migrations'
      ) AS "exists"
    `)

    if (tableCheck.rows[0]?.exists) {
      await client.query("DELETE FROM payload_migrations WHERE batch = -1 AND name = 'dev'")
    }
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined

    if (code !== '42P01') {
      console.warn('Unable to remove Payload dev migration marker before startup migrations.', error)
    }
  } finally {
    await client.end().catch(() => {})
  }
}

await removeDevMigrationMarker()

const dbAdapter = useSqlite
  ? (await import('@payloadcms/db-sqlite')).sqliteAdapter({
      client: {
        url: databaseUri || 'file:./data/ablaut.db',
      },
      push: pushDatabaseSchema,
    })
  : await (async () => {
      const [{ postgresAdapter }, { migrations }] = await Promise.all([
        import('@payloadcms/db-postgres'),
        import('./migrations'),
      ])

      return postgresAdapter({
        pool: {
          connectionString: databaseUri,
        },
        prodMigrations: migrations,
        push: pushDatabaseSchema,
      })
    })()

function requirePayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) {
    throw new Error(
      'PAYLOAD_SECRET is missing or empty. Set it in .env (see .env.example). Use a long random string - at least 32 characters in production.',
    )
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('PAYLOAD_SECRET must be at least 32 characters in production.')
  }

  return secret
}

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ['@/components/PayloadDashboardIntro#PayloadDashboardIntro'],
      beforeNavLinks: ['@/components/PayloadDashboardLink#PayloadDashboardLink'],
      graphics: {
        Icon: '@/components/PayloadAdminIcon#PayloadAdminIcon',
        Logo: '@/components/PayloadAdminLogo#PayloadAdminLogo',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    Organizations,
    OrganizationMemberships,
    Events,
    Channels,
    EventAssignments,
    AuditLogs,
  ],
  db: dbAdapter,
  editor: lexicalEditor(),
  email: await buildEmailAdapter(),
  globals: [SiteSettings],
  onInit: runStartupBootstrap,
  plugins: [],
  secret: requirePayloadSecret(),
  serverURL:
    process.env.PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

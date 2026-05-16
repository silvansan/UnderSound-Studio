import { config as loadEnv } from 'dotenv'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
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
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUri = process.env.DATABASE_URI || ''
const useSqlite =
  process.env.PAYLOAD_DATABASE === 'sqlite' || databaseUri.startsWith('file:')

function requirePayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) {
    throw new Error(
      'PAYLOAD_SECRET is missing or empty. Set it in .env (see .env.example). Use a long random string — at least 32 characters in production.',
    )
  }
  return secret
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Events, Channels, EventAssignments, AuditLogs],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: requirePayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: useSqlite
    ? sqliteAdapter({
        client: {
          url: databaseUri || 'file:./data/undersound.db',
        },
      })
    : postgresAdapter({
        pool: {
          connectionString: databaseUri,
        },
      }),
  sharp,
  plugins: [],
})

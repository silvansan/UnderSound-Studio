import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "mobile_app_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "mobile_app_latest_version" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_app_latest_tag" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_app_download_url" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_app_release_notes" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_app_published_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "mobile_app_last_synced_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "mobile_app_github_repo" varchar DEFAULT 'silvansan/ablaut-App';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "mobile_app_enabled",
      DROP COLUMN IF EXISTS "mobile_app_latest_version",
      DROP COLUMN IF EXISTS "mobile_app_latest_tag",
      DROP COLUMN IF EXISTS "mobile_app_download_url",
      DROP COLUMN IF EXISTS "mobile_app_release_notes",
      DROP COLUMN IF EXISTS "mobile_app_published_at",
      DROP COLUMN IF EXISTS "mobile_app_last_synced_at",
      DROP COLUMN IF EXISTS "mobile_app_github_repo";
  `)
}

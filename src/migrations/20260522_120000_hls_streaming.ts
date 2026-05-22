import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "hls_playback_url" varchar,
      ADD COLUMN IF NOT EXISTS "hls_egress_status" varchar DEFAULT 'idle',
      ADD COLUMN IF NOT EXISTS "hls_egress_id" varchar;

    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "hls_public_base_url" varchar,
      ADD COLUMN IF NOT EXISTS "hls_mode" varchar DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS "hls_segment_duration" numeric DEFAULT 2;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "hls_playback_url",
      DROP COLUMN IF EXISTS "hls_egress_status",
      DROP COLUMN IF EXISTS "hls_egress_id";

    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "hls_public_base_url",
      DROP COLUMN IF EXISTS "hls_mode",
      DROP COLUMN IF EXISTS "hls_segment_duration";
  `)
}

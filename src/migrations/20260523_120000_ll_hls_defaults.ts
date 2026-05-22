import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
      SET "hls_mode" = 'low-latency'
      WHERE "hls_mode" IS NULL OR "hls_mode" = 'standard';

    UPDATE "site_settings"
      SET "hls_segment_duration" = 1
      WHERE "hls_segment_duration" IS NULL OR "hls_segment_duration" > 1;

    UPDATE "channels"
      SET "hls_enabled" = true
      WHERE "hls_enabled" IS NULL OR "hls_enabled" = false;

    ALTER TABLE "site_settings"
      ALTER COLUMN "hls_mode" SET DEFAULT 'low-latency',
      ALTER COLUMN "hls_segment_duration" SET DEFAULT 1;

    ALTER TABLE "channels"
      ALTER COLUMN "hls_enabled" SET DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ALTER COLUMN "hls_mode" SET DEFAULT 'standard',
      ALTER COLUMN "hls_segment_duration" SET DEFAULT 2;

    ALTER TABLE "channels"
      ALTER COLUMN "hls_enabled" SET DEFAULT false;
  `)
}

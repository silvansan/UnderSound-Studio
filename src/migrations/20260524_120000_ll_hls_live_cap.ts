import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
      SET "hls_mode" = 'low-latency'
      WHERE "hls_mode" IS NULL OR "hls_mode" <> 'low-latency';

    UPDATE "site_settings"
      SET "hls_segment_duration" = 1
      WHERE "hls_segment_duration" IS NULL OR "hls_segment_duration" > 4 OR "hls_segment_duration" < 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SELECT 1;
  `)
}

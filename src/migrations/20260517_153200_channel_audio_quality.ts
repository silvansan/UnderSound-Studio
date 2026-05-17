import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "channels"
      ADD COLUMN IF NOT EXISTS "audio_quality_echo_cancellation" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "audio_quality_noise_suppression" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "audio_quality_auto_gain_control" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "channels"
      DROP COLUMN IF EXISTS "audio_quality_echo_cancellation",
      DROP COLUMN IF EXISTS "audio_quality_noise_suppression",
      DROP COLUMN IF EXISTS "audio_quality_auto_gain_control";
  `)
}

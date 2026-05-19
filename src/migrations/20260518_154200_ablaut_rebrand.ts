import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_site_settings_default_qr_style_ablaut" AS ENUM(
      'ablaut-default',
      'high-contrast',
      'undersound-default'
    );

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" DROP DEFAULT,
      ALTER COLUMN "default_qr_style" TYPE "public"."enum_site_settings_default_qr_style_ablaut"
        USING "default_qr_style"::text::"public"."enum_site_settings_default_qr_style_ablaut";

    DROP TYPE "public"."enum_site_settings_default_qr_style";
    ALTER TYPE "public"."enum_site_settings_default_qr_style_ablaut"
      RENAME TO "enum_site_settings_default_qr_style";
  `)

  await db.execute(sql`
    ALTER TABLE "site_settings"
      ALTER COLUMN "site_name" SET DEFAULT 'ablaut',
      ALTER COLUMN "default_qr_style" SET DEFAULT 'ablaut-default';
  `)

  await db.execute(sql`
    UPDATE "site_settings"
    SET
      "site_name" = CASE WHEN "site_name" = 'UnderSound' THEN 'ablaut' ELSE "site_name" END,
      "default_qr_style" = CASE
        WHEN "default_qr_style" = 'undersound-default' THEN 'ablaut-default'::"public"."enum_site_settings_default_qr_style"
        ELSE "default_qr_style"
      END;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
    SET "default_qr_style" = 'undersound-default'
    WHERE "default_qr_style" = 'ablaut-default';
  `)

  await db.execute(sql`
    ALTER TABLE "site_settings"
      ALTER COLUMN "site_name" SET DEFAULT 'UnderSound',
      ALTER COLUMN "default_qr_style" DROP DEFAULT;

    CREATE TYPE "public"."enum_site_settings_default_qr_style_undersound" AS ENUM(
      'undersound-default',
      'high-contrast'
    );

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" TYPE "public"."enum_site_settings_default_qr_style_undersound"
        USING "default_qr_style"::text::"public"."enum_site_settings_default_qr_style_undersound";

    DROP TYPE "public"."enum_site_settings_default_qr_style";
    ALTER TYPE "public"."enum_site_settings_default_qr_style_undersound"
      RENAME TO "enum_site_settings_default_qr_style";

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" SET DEFAULT 'undersound-default';
  `)
}

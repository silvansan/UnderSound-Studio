import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "site_settings"
    SET "default_qr_style" = 'ablaut-default'
    WHERE "default_qr_style"::text = 'undersound-default';

    CREATE TYPE "public"."enum_site_settings_default_qr_style_new" AS ENUM(
      'ablaut-default',
      'high-contrast'
    );

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" DROP DEFAULT,
      ALTER COLUMN "default_qr_style" TYPE "public"."enum_site_settings_default_qr_style_new"
        USING "default_qr_style"::text::"public"."enum_site_settings_default_qr_style_new";

    DROP TYPE "public"."enum_site_settings_default_qr_style";
    ALTER TYPE "public"."enum_site_settings_default_qr_style_new"
      RENAME TO "enum_site_settings_default_qr_style";

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" SET DEFAULT 'ablaut-default';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_site_settings_default_qr_style_legacy" AS ENUM(
      'ablaut-default',
      'high-contrast',
      'undersound-default'
    );

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" DROP DEFAULT,
      ALTER COLUMN "default_qr_style" TYPE "public"."enum_site_settings_default_qr_style_legacy"
        USING "default_qr_style"::text::"public"."enum_site_settings_default_qr_style_legacy";

    DROP TYPE "public"."enum_site_settings_default_qr_style";
    ALTER TYPE "public"."enum_site_settings_default_qr_style_legacy"
      RENAME TO "enum_site_settings_default_qr_style";

    ALTER TABLE "site_settings"
      ALTER COLUMN "default_qr_style" SET DEFAULT 'ablaut-default';
  `)
}

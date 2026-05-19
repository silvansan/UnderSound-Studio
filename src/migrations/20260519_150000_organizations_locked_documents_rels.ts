import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload's locked-documents polymorphic rel table must include a column per collection.
 * The organizations migration added the collections but not these rel columns, which
 * breaks delete (and other operations) on organizations in existing Postgres databases.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "organizations_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "organization_memberships_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organizations_id_idx"
      ON "payload_locked_documents_rels" ("organizations_id");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organization_memberships_id_idx"
      ON "payload_locked_documents_rels" ("organization_memberships_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_organizations_fk"
        FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_organization_memberships_fk"
        FOREIGN KEY ("organization_memberships_id") REFERENCES "public"."organization_memberships"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_organization_memberships_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_organizations_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_organization_memberships_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_organizations_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "organization_memberships_id";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "organizations_id";
  `)
}

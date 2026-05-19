import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_organization_memberships_role_in_organization" AS ENUM(
      'owner',
      'manager',
      'moderator',
      'viewer'
    );

    CREATE TYPE "public"."enum_organization_memberships_status" AS ENUM(
      'pending',
      'active',
      'rejected',
      'revoked'
    );

    CREATE TABLE IF NOT EXISTS "organizations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar,
      "active" boolean DEFAULT true,
      "support_email" varchar,
      "created_by_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");

    CREATE TABLE IF NOT EXISTS "organization_memberships" (
      "id" serial PRIMARY KEY NOT NULL,
      "organization_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "role_in_organization" "public"."enum_organization_memberships_role_in_organization" DEFAULT 'moderator' NOT NULL,
      "status" "public"."enum_organization_memberships_status" DEFAULT 'pending' NOT NULL,
      "invited_by_id" integer,
      "requested_by_id" integer,
      "approved_by_id" integer,
      "invited_at" timestamp(3) with time zone,
      "requested_at" timestamp(3) with time zone,
      "approved_at" timestamp(3) with time zone,
      "revoked_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "organization_id" integer;

    DO $$ BEGIN
      ALTER TABLE "organizations"
        ADD CONSTRAINT "organizations_created_by_id_users_id_fk"
        FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "organization_memberships"
        ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk"
        FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "organization_memberships"
        ADD CONSTRAINT "organization_memberships_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "events"
        ADD CONSTRAINT "events_organization_id_organizations_id_fk"
        FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

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

    ALTER TABLE "events" DROP COLUMN IF EXISTS "organization_id";
    DROP TABLE IF EXISTS "organization_memberships" CASCADE;
    DROP TABLE IF EXISTS "organizations" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_organization_memberships_status";
    DROP TYPE IF EXISTS "public"."enum_organization_memberships_role_in_organization";
  `)
}

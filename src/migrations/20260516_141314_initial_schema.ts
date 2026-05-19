import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'admin', 'moderator');
  CREATE TYPE "public"."enum_users_invitation_status" AS ENUM('none', 'pending', 'accepted', 'expired');
  CREATE TYPE "public"."enum_users_two_factor_method" AS ENUM('app', 'email');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_channels_listener_token_mode" AS ENUM('public', 'password', 'private');
  CREATE TYPE "public"."enum_event_assignments_role_for_event" AS ENUM('admin', 'moderator', 'viewer');
  CREATE TYPE "public"."enum_site_settings_default_qr_style" AS ENUM('ablaut-default', 'high-contrast', 'undersound-default');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'moderator' NOT NULL,
  	"active" boolean DEFAULT true,
  	"preferred_language" varchar DEFAULT 'en',
  	"last_login" timestamp(3) with time zone,
  	"invitation_status" "enum_users_invitation_status" DEFAULT 'none',
  	"invited_at" timestamp(3) with time zone,
  	"invitation_accepted_at" timestamp(3) with time zone,
  	"invited_by_id" integer,
  	"two_factor_enabled" boolean DEFAULT false,
  	"two_factor_method" "enum_users_two_factor_method",
  	"two_factor_secret" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"status" "enum_events_status" DEFAULT 'draft',
  	"event_logo_id" integer,
  	"date_start" timestamp(3) with time zone,
  	"date_end" timestamp(3) with time zone,
  	"location" varchar,
  	"default_language" varchar DEFAULT 'en',
  	"public_listener_enabled" boolean DEFAULT true,
  	"listener_password_enabled" boolean DEFAULT false,
  	"listener_password_hash" varchar,
  	"speaker_password_enabled" boolean DEFAULT false,
  	"speaker_password_hash" varchar,
  	"qr_settings_foreground_color" varchar DEFAULT '#1a3d2e',
  	"qr_settings_background_color" varchar DEFAULT '#ffffff',
  	"qr_settings_include_blue_accent" boolean DEFAULT false,
  	"theme_override_enabled" boolean DEFAULT false,
  	"theme_override_green_dark" varchar,
  	"theme_override_green" varchar,
  	"theme_override_green_light" varchar,
  	"theme_override_blue" varchar,
  	"theme_override_blue_dark" varchar,
  	"theme_override_background" varchar,
  	"theme_override_card" varchar,
  	"theme_override_text" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"channels_id" integer
  );
  
  CREATE TABLE "channels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"language_code" varchar,
  	"language_label" varchar,
  	"description" varchar,
  	"enabled" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"room_name" varchar,
  	"livekit_room_name" varchar,
  	"webrtc_enabled" boolean DEFAULT true,
  	"hls_enabled" boolean DEFAULT false,
  	"icecast_fallback_url" varchar,
  	"listener_page_enabled" boolean DEFAULT true,
  	"speaker_page_enabled" boolean DEFAULT true,
  	"listener_token_mode" "enum_channels_listener_token_mode" DEFAULT 'public',
  	"speaker_password_enabled" boolean DEFAULT false,
  	"speaker_password_hash" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"event_id" integer NOT NULL,
  	"role_for_event" "enum_event_assignments_role_for_event" NOT NULL,
  	"permissions_can_edit_event" boolean DEFAULT false,
  	"permissions_can_create_channels" boolean DEFAULT false,
  	"permissions_can_delete_channels" boolean DEFAULT false,
  	"permissions_can_view_q_r" boolean DEFAULT true,
  	"permissions_can_manage_speaker_password" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"action" varchar NOT NULL,
  	"collection" varchar,
  	"document_id" varchar,
  	"event_id" integer,
  	"channel_id" integer,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"events_id" integer,
  	"channels_id" integer,
  	"event_assignments_id" integer,
  	"audit_logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'ablaut',
  	"default_logo_id" integer,
  	"public_base_url" varchar,
  	"support_email" varchar,
  	"allow_public_listener_pages" boolean DEFAULT true,
  	"require_email_verification" boolean DEFAULT true,
  	"default_token_expiry" numeric DEFAULT 3600,
  	"livekit_public_url" varchar,
  	"default_qr_style" "enum_site_settings_default_qr_style" DEFAULT 'ablaut-default',
  	"default_theme_colors_green_dark" varchar DEFAULT '#1a3d2e',
  	"default_theme_colors_green" varchar DEFAULT '#2d6a4f',
  	"default_theme_colors_green_light" varchar DEFAULT '#95d5b2',
  	"default_theme_colors_blue" varchar DEFAULT '#4ea8de',
  	"default_theme_colors_blue_dark" varchar DEFAULT '#1d3557',
  	"default_theme_colors_background" varchar DEFAULT '#f6fbf8',
  	"default_theme_colors_card" varchar DEFAULT '#ffffff',
  	"default_theme_colors_text" varchar DEFAULT '#102418',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_event_logo_id_media_id_fk" FOREIGN KEY ("event_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_channels_fk" FOREIGN KEY ("channels_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "channels" ADD CONSTRAINT "channels_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "channels" ADD CONSTRAINT "channels_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_channels_fk" FOREIGN KEY ("channels_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_assignments_fk" FOREIGN KEY ("event_assignments_id") REFERENCES "public"."event_assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_logo_id_media_id_fk" FOREIGN KEY ("default_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_invited_by_idx" ON "users" USING btree ("invited_by_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_event_logo_idx" ON "events" USING btree ("event_logo_id");
  CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_users_id_idx" ON "events_rels" USING btree ("users_id");
  CREATE INDEX "events_rels_channels_id_idx" ON "events_rels" USING btree ("channels_id");
  CREATE INDEX "channels_event_idx" ON "channels" USING btree ("event_id");
  CREATE INDEX "channels_slug_idx" ON "channels" USING btree ("slug");
  CREATE INDEX "channels_created_by_idx" ON "channels" USING btree ("created_by_id");
  CREATE INDEX "channels_updated_at_idx" ON "channels" USING btree ("updated_at");
  CREATE INDEX "channels_created_at_idx" ON "channels" USING btree ("created_at");
  CREATE INDEX "event_assignments_user_idx" ON "event_assignments" USING btree ("user_id");
  CREATE INDEX "event_assignments_event_idx" ON "event_assignments" USING btree ("event_id");
  CREATE INDEX "event_assignments_updated_at_idx" ON "event_assignments" USING btree ("updated_at");
  CREATE INDEX "event_assignments_created_at_idx" ON "event_assignments" USING btree ("created_at");
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_event_idx" ON "audit_logs" USING btree ("event_id");
  CREATE INDEX "audit_logs_channel_idx" ON "audit_logs" USING btree ("channel_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_channels_id_idx" ON "payload_locked_documents_rels" USING btree ("channels_id");
  CREATE INDEX "payload_locked_documents_rels_event_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("event_assignments_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_default_logo_idx" ON "site_settings" USING btree ("default_logo_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "channels" CASCADE;
  DROP TABLE "event_assignments" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_invitation_status";
  DROP TYPE "public"."enum_users_two_factor_method";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_channels_listener_token_mode";
  DROP TYPE "public"."enum_event_assignments_role_for_event";
  DROP TYPE "public"."enum_site_settings_default_qr_style";`)
}

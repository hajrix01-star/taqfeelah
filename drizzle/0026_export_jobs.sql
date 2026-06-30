CREATE TABLE IF NOT EXISTS "export_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "type" text NOT NULL,
  "format" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "row_count" integer DEFAULT 0 NOT NULL,
  "file_path" text,
  "file_name" text,
  "mime_type" text,
  "error_message" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_store_id_stores_id_fk"
  FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_created_by_user_id_users_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_org_store_fk"
  FOREIGN KEY ("organization_id","store_id") REFERENCES "public"."stores"("organization_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_org_user_status_idx"
  ON "export_jobs" ("organization_id","created_by_user_id","status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_org_store_created_idx"
  ON "export_jobs" ("organization_id","store_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "export_jobs_status_expires_idx"
  ON "export_jobs" ("status","expires_at");
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_status_chk"
  CHECK ("status" in ('pending', 'processing', 'ready', 'failed'));
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_format_chk"
  CHECK ("format" in ('excel', 'csv'));
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_type_chk"
  CHECK ("type" in ('register_operations'));
--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_row_count_nonnegative_chk"
  CHECK ("row_count" >= 0);

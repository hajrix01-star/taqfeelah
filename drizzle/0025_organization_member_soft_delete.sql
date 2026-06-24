ALTER TABLE "organization_members"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "organization_members_org_status_deleted_idx"
  ON "organization_members" ("organization_id", "status", "deleted_at");

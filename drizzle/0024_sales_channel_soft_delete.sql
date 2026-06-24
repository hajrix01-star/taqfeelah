ALTER TABLE "sales_channels"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "sales_channels_org_store_deleted_idx"
  ON "sales_channels" ("organization_id", "store_id", "deleted_at");

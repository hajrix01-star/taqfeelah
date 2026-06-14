CREATE INDEX IF NOT EXISTS "attachments_org_store_entry_idx"
  ON "attachments" ("organization_id", "store_id", "entry_id");

CREATE INDEX IF NOT EXISTS "audit_events_org_store_action_created_idx"
  ON "audit_events" ("organization_id", "store_id", "action", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "daily_closeouts_org_store_date_created_id_idx"
  ON "daily_closeouts" ("organization_id", "store_id", "date" DESC, "created_at" DESC, "id" DESC);

CREATE TABLE IF NOT EXISTS "platform_admin_grants" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  "granted_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "platform_admin_grants_granted_at_idx"
  ON "platform_admin_grants" ("granted_at");

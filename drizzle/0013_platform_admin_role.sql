ALTER TABLE "platform_admin_grants"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'owner';

UPDATE "platform_admin_grants"
SET "role" = 'owner'
WHERE "role" IS NULL OR "role" NOT IN ('owner', 'support');

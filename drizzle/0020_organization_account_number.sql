CREATE SEQUENCE IF NOT EXISTS organization_account_number_seq START WITH 100001;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "account_number" integer;

UPDATE "organizations"
SET "account_number" = nextval('organization_account_number_seq')
WHERE "account_number" IS NULL;

ALTER TABLE "organizations" ALTER COLUMN "account_number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_account_number_uq" ON "organizations" ("account_number");

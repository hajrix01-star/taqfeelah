ALTER TABLE "sales_channels"
ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'payment_method';

UPDATE "sales_channels"
SET "kind" = 'payment_method'
WHERE "kind" IS NULL OR "kind" = '';

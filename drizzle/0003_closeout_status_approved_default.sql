-- Zero-review policy: persisted closeouts are approved on submit.
-- Backfill legacy default rows before changing the column default.
UPDATE "daily_closeouts" SET "status" = 'approved' WHERE "status" = 'submitted';
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ALTER COLUMN "status" SET DEFAULT 'approved';

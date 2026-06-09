DELETE FROM "entries" WHERE "closeout_id" IS NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "closeout_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "subscription_renewal_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "subscription_id" uuid NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  "reminder_tier" integer NOT NULL,
  "channel" text NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_renewal_reminders_org_tier_period_uq"
  ON "subscription_renewal_reminders" ("organization_id", "reminder_tier", "period_end");

CREATE INDEX IF NOT EXISTS "subscription_renewal_reminders_period_end_idx"
  ON "subscription_renewal_reminders" ("period_end");

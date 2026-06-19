CREATE TABLE "signup_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"organization_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"owner_phone" text NOT NULL,
	"store_name" text,
	"plan_code" text DEFAULT 'trial' NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending_verification' NOT NULL,
	"organization_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signup_requests" ADD CONSTRAINT "signup_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "signup_requests_token_hash_uq" ON "signup_requests" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "signup_requests_email_created_idx" ON "signup_requests" USING btree ("email","created_at");
--> statement-breakpoint
CREATE INDEX "signup_requests_status_expires_idx" ON "signup_requests" USING btree ("status","expires_at");
--> statement-breakpoint
ALTER TABLE "account_setup_tokens" ADD COLUMN "owner_email" text;

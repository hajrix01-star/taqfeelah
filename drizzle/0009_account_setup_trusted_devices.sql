CREATE TABLE "account_setup_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"phone_number" text NOT NULL,
	"owner_name" text,
	"token_hash" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_setup_tokens" ADD CONSTRAINT "account_setup_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "account_setup_tokens" ADD CONSTRAINT "account_setup_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "account_setup_tokens" ADD CONSTRAINT "account_setup_tokens_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "account_setup_tokens_token_hash_uq" ON "account_setup_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "account_setup_tokens_org_created_idx" ON "account_setup_tokens" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE TABLE "trusted_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_token_hash" text NOT NULL,
	"user_agent" text,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "trusted_devices_user_revoked_idx" ON "trusted_devices" USING btree ("user_id","revoked_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "trusted_devices_device_token_hash_uq" ON "trusted_devices" USING btree ("device_token_hash");
--> statement-breakpoint
ALTER TABLE "auth_identities" ADD COLUMN "login_phone" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_login_phone_provider_uq" ON "auth_identities" USING btree ("provider","login_phone") WHERE "login_phone" IS NOT NULL;

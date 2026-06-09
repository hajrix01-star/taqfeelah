CREATE TABLE "daily_closeouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"date" date NOT NULL,
	"day_sequence" integer NOT NULL,
	"client_closeout_id" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"return_reason" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "closeout_id" uuid;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "operational_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_closeouts_store_date_sequence_uq" ON "daily_closeouts" USING btree ("store_id","date","day_sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_closeouts_store_client_closeout_uq" ON "daily_closeouts" USING btree ("store_id","client_closeout_id");--> statement-breakpoint
CREATE INDEX "daily_closeouts_org_store_date_status_idx" ON "daily_closeouts" USING btree ("organization_id","store_id","date","status");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_closeout_id_daily_closeouts_id_fk" FOREIGN KEY ("closeout_id") REFERENCES "public"."daily_closeouts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_user_provider_uq" ON "auth_identities" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_username_password_uq" ON "auth_identities" USING btree ("provider","username") WHERE "auth_identities"."provider" = 'username_password';--> statement-breakpoint
CREATE INDEX "entries_closeout_idx" ON "entries" USING btree ("closeout_id");
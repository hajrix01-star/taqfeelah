CREATE TABLE "owner_notebook_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"kind" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"color" text DEFAULT 'yellow' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "owner_notebook_notes" ADD CONSTRAINT "owner_notebook_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "owner_notebook_notes" ADD CONSTRAINT "owner_notebook_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "owner_notebook_notes_org_user_idx" ON "owner_notebook_notes" USING btree ("organization_id","user_id");
--> statement-breakpoint
CREATE INDEX "owner_notebook_notes_org_user_updated_idx" ON "owner_notebook_notes" USING btree ("organization_id","user_id","updated_at");

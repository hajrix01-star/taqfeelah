CREATE TABLE "org_engagement_snapshots" (
	"snapshot_date" date NOT NULL,
	"organization_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"organization_status" text NOT NULL,
	"subscription_status" text,
	"billing_type" text NOT NULL,
	"plan_code" text,
	"tenure_days" integer DEFAULT 0 NOT NULL,
	"active_days_l30" integer DEFAULT 0 NOT NULL,
	"active_users_l30" integer DEFAULT 0 NOT NULL,
	"closeouts_l30" integer DEFAULT 0 NOT NULL,
	"entries_l30" integer DEFAULT 0 NOT NULL,
	"sales_halalas_l30" bigint DEFAULT 0 NOT NULL,
	"engagement_segment" text NOT NULL,
	"last_core_activity_at" timestamp with time zone,
	"days_since_last_core_activity" integer,
	"stores_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_engagement_snapshots_pk" PRIMARY KEY("snapshot_date","organization_id")
);
--> statement-breakpoint
ALTER TABLE "org_engagement_snapshots" ADD CONSTRAINT "org_engagement_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "org_engagement_snapshots_segment_date_idx" ON "org_engagement_snapshots" USING btree ("snapshot_date","engagement_segment");
--> statement-breakpoint
CREATE INDEX "org_engagement_snapshots_billing_date_idx" ON "org_engagement_snapshots" USING btree ("snapshot_date","billing_type");

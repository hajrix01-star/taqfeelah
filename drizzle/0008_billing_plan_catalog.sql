CREATE TABLE "plan_catalog" (
	"plan_code" text PRIMARY KEY NOT NULL,
	"display_name_ar" text NOT NULL,
	"display_name_en" text NOT NULL,
	"price_monthly_halalas" bigint NOT NULL,
	"price_yearly_halalas" bigint,
	"max_stores" integer NOT NULL,
	"max_employees" integer NOT NULL,
	"trial_days" integer DEFAULT 14 NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_entitlement_overrides" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"max_stores_override" integer,
	"max_employees_override" integer,
	"price_monthly_override_halalas" bigint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_entitlement_overrides" ADD CONSTRAINT "organization_entitlement_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "plan_catalog" ("plan_code", "display_name_ar", "display_name_en", "price_monthly_halalas", "price_yearly_halalas", "max_stores", "max_employees", "trial_days", "features", "is_active", "sort_order") VALUES
  ('starter', 'أساسية', 'Starter', 9900, 99000, 1, 5, 14, '{}'::jsonb, true, 1),
  ('growth', 'نمو', 'Growth', 29900, 299000, 3, 20, 14, '{"multiStore":true}'::jsonb, true, 2),
  ('enterprise', 'مؤسسات', 'Enterprise', 0, 0, 99, 999, 30, '{"multiStore":true,"customContract":true}'::jsonb, true, 3);

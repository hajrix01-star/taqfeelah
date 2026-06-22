-- Preserve closeout history and enforce tenant/value integrity at the database boundary.
ALTER TABLE "daily_closeouts" ADD COLUMN IF NOT EXISTS "voided_by_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD COLUMN IF NOT EXISTS "voided_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_voided_by_user_id_users_id_fk"
  FOREIGN KEY ("voided_by_user_id") REFERENCES "public"."users"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Composite unique keys are deliberate: they allow PostgreSQL itself to prove
-- that a child row's organization/store matches its referenced parent.
CREATE UNIQUE INDEX "stores_organization_id_id_uq"
  ON "stores" ("organization_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_channels_org_store_id_uq"
  ON "sales_channels" ("organization_id", "store_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX "outflow_categories_org_store_id_uq"
  ON "outflow_categories" ("organization_id", "store_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX "daily_closeouts_org_store_id_uq"
  ON "daily_closeouts" ("organization_id", "store_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX "entries_org_store_id_uq"
  ON "entries" ("organization_id", "store_id", "id");
--> statement-breakpoint

ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_org_store_fk"
  FOREIGN KEY ("organization_id", "store_id")
  REFERENCES "stores" ("organization_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint
ALTER TABLE "outflow_categories" ADD CONSTRAINT "outflow_categories_org_store_fk"
  FOREIGN KEY ("organization_id", "store_id")
  REFERENCES "stores" ("organization_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_org_store_fk"
  FOREIGN KEY ("organization_id", "store_id")
  REFERENCES "stores" ("organization_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_org_store_fk"
  FOREIGN KEY ("organization_id", "store_id")
  REFERENCES "stores" ("organization_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_org_store_closeout_fk"
  FOREIGN KEY ("organization_id", "store_id", "closeout_id")
  REFERENCES "daily_closeouts" ("organization_id", "store_id", "id")
  ON DELETE restrict NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_org_store_category_fk"
  FOREIGN KEY ("organization_id", "store_id", "category_id")
  REFERENCES "outflow_categories" ("organization_id", "store_id", "id")
  ON DELETE restrict NOT VALID;
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" ADD CONSTRAINT "entry_sales_channels_org_store_entry_fk"
  FOREIGN KEY ("organization_id", "store_id", "entry_id")
  REFERENCES "entries" ("organization_id", "store_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" ADD CONSTRAINT "entry_sales_channels_org_store_channel_fk"
  FOREIGN KEY ("organization_id", "store_id", "sales_channel_id")
  REFERENCES "sales_channels" ("organization_id", "store_id", "id")
  ON DELETE restrict NOT VALID;
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_org_store_entry_fk"
  FOREIGN KEY ("organization_id", "store_id", "entry_id")
  REFERENCES "entries" ("organization_id", "store_id", "id")
  ON DELETE cascade NOT VALID;
--> statement-breakpoint

ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_day_sequence_positive_chk"
  CHECK ("day_sequence" > 0) NOT VALID;
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_status_chk"
  CHECK ("status" IN ('approved', 'voided')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "daily_closeouts" ADD CONSTRAINT "daily_closeouts_client_id_nonempty_chk"
  CHECK (btrim("client_closeout_id") <> '') NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_type_chk"
  CHECK ("type" IN ('summary', 'purchases', 'expense', 'withdrawal')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_amount_chk"
  CHECK ("amount_halalas" >= 0 AND ("type" = 'summary' OR "amount_halalas" > 0)) NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_currency_chk"
  CHECK ("currency" = 'SAR') NOT VALID;
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_status_chk"
  CHECK ("status" IN ('active', 'voided')) NOT VALID;
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" ADD CONSTRAINT "entry_sales_channels_amount_positive_chk"
  CHECK ("amount_halalas" > 0) NOT VALID;
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_size_nonnegative_chk"
  CHECK ("size_bytes" >= 0) NOT VALID;
--> statement-breakpoint

-- Validation makes pre-existing inconsistencies fail the migration instead of
-- silently accepting them. New writes are protected even before validation.
ALTER TABLE "sales_channels" VALIDATE CONSTRAINT "sales_channels_org_store_fk";
--> statement-breakpoint
ALTER TABLE "outflow_categories" VALIDATE CONSTRAINT "outflow_categories_org_store_fk";
--> statement-breakpoint
ALTER TABLE "daily_closeouts" VALIDATE CONSTRAINT "daily_closeouts_org_store_fk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_org_store_fk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_org_store_closeout_fk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_org_store_category_fk";
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" VALIDATE CONSTRAINT "entry_sales_channels_org_store_entry_fk";
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" VALIDATE CONSTRAINT "entry_sales_channels_org_store_channel_fk";
--> statement-breakpoint
ALTER TABLE "attachments" VALIDATE CONSTRAINT "attachments_org_store_entry_fk";
--> statement-breakpoint
ALTER TABLE "daily_closeouts" VALIDATE CONSTRAINT "daily_closeouts_day_sequence_positive_chk";
--> statement-breakpoint
ALTER TABLE "daily_closeouts" VALIDATE CONSTRAINT "daily_closeouts_status_chk";
--> statement-breakpoint
ALTER TABLE "daily_closeouts" VALIDATE CONSTRAINT "daily_closeouts_client_id_nonempty_chk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_type_chk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_amount_chk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_currency_chk";
--> statement-breakpoint
ALTER TABLE "entries" VALIDATE CONSTRAINT "entries_status_chk";
--> statement-breakpoint
ALTER TABLE "entry_sales_channels" VALIDATE CONSTRAINT "entry_sales_channels_amount_positive_chk";
--> statement-breakpoint
ALTER TABLE "attachments" VALIDATE CONSTRAINT "attachments_size_nonnegative_chk";

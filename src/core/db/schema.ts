import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    phoneNumber: text("phone_number"),
    username: text("username"),
    passwordHash: text("password_hash"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userProviderUq: uniqueIndex("auth_identities_user_provider_uq").on(table.userId, table.provider),
    usernamePasswordUq: uniqueIndex("auth_identities_username_password_uq")
      .on(table.provider, table.username)
      .where(sql`${table.provider} = 'username_password'`),
  }),
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgUserStatusIdx: index("organization_members_org_user_status_idx").on(
      table.organizationId,
      table.userId,
      table.status,
    ),
  }),
);

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  status: text("status").notNull().default("active"),
  operationalSettings: jsonb("operational_settings")
    .$type<StoreOperationalSettings>()
    .notNull()
    .default({} as StoreOperationalSettings),
  createdAt,
  updatedAt,
});

export const memberStoreAccess = pgTable(
  "member_store_access",
  {
    organizationMemberId: uuid("organization_member_id")
      .notNull()
      .references(() => organizationMembers.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      name: "member_store_access_pk",
      columns: [table.organizationMemberId, table.storeId],
    }),
  }),
);

export const salesChannels = pgTable("sales_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt,
  retiredAt: timestamp("retired_at", { withTimezone: true }),
});

export const outflowCategories = pgTable("outflow_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt,
  retiredAt: timestamp("retired_at", { withTimezone: true }),
});

export const dailyCloseouts = pgTable(
  "daily_closeouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    daySequence: integer("day_sequence").notNull(),
    clientCloseoutId: text("client_closeout_id").notNull(),
    /** Zero-review: always `approved` on submit (migration 0003). */
    status: text("status").notNull().default("approved"),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id),
    /** Set on auto-approve at submit (legacy column name from removed owner-review flow). */
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    /** Legacy owner-return reason; unused under zero-review policy. */
    returnReason: text("return_reason"),
    note: text("note"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    storeDateSequenceUq: uniqueIndex("daily_closeouts_store_date_sequence_uq").on(
      table.storeId,
      table.date,
      table.daySequence,
    ),
    storeClientCloseoutUq: uniqueIndex("daily_closeouts_store_client_closeout_uq").on(
      table.storeId,
      table.clientCloseoutId,
    ),
    orgStoreDateStatusIdx: index("daily_closeouts_org_store_date_status_idx").on(
      table.organizationId,
      table.storeId,
      table.date,
      table.status,
    ),
  }),
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    closeoutId: uuid("closeout_id")
      .notNull()
      .references(() => dailyCloseouts.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    type: text("type").notNull(),
    amountHalalas: integer("amount_halalas").notNull(),
    currency: text("currency").notNull().default("SAR"),
    categoryId: uuid("category_id").references(() => outflowCategories.id),
    note: text("note"),
    enteredByUserId: uuid("entered_by_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("active"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    restoredAt: timestamp("restored_at", { withTimezone: true }),
    correctedFromEntryId: uuid("corrected_from_entry_id"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgStoreDateStatusIdx: index("entries_org_store_date_status_idx").on(
      table.organizationId,
      table.storeId,
      table.date,
      table.status,
    ),
    orgStoreTypeDateStatusIdx: index("entries_org_store_type_date_status_idx").on(
      table.organizationId,
      table.storeId,
      table.type,
      table.date,
      table.status,
    ),
    orgStoreDateCreatedIdx: index("entries_org_store_date_created_idx").on(
      table.organizationId,
      table.storeId,
      table.date,
      table.createdAt,
      table.id,
    ),
    closeoutIdx: index("entries_closeout_idx").on(table.closeoutId),
  }),
);

export const entrySalesChannels = pgTable(
  "entry_sales_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    salesChannelId: uuid("sales_channel_id")
      .notNull()
      .references(() => salesChannels.id, { onDelete: "restrict" }),
    channelNameSnapshot: text("channel_name_snapshot").notNull(),
    amountHalalas: integer("amount_halalas").notNull(),
  },
  (table) => ({
    entryIdx: index("entry_sales_channels_entry_idx").on(table.organizationId, table.storeId, table.entryId),
    channelIdx: index("entry_sales_channels_channel_idx").on(
      table.organizationId,
      table.storeId,
      table.salesChannelId,
    ),
  }),
);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  originalFileName: text("original_file_name"),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt,
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    createdAt,
  },
  (table) => ({
    orgStoreEntryCreatedIdx: index("audit_events_org_store_entry_created_idx").on(
      table.organizationId,
      table.storeId,
      table.entryId,
      table.createdAt,
    ),
  }),
);

// Final phase SaaS management tables.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planCode: text("plan_code").notNull(),
    status: text("status").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgStatusPeriodIdx: index("subscriptions_org_status_period_idx").on(
      table.organizationId,
      table.status,
      table.currentPeriodEnd,
    ),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    providerInvoiceId: text("provider_invoice_id"),
    status: text("status").notNull(),
    amountHalalas: bigint("amount_halalas", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("SAR"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt,
  },
  (table) => ({
    orgIssuedAtIdx: index("invoices_org_issued_at_idx").on(table.organizationId, table.issuedAt),
    statusDueAtIdx: index("invoices_status_due_at_idx").on(table.status, table.dueAt),
    providerUnique: uniqueIndex("invoices_provider_invoice_id_uq").on(table.providerInvoiceId),
  }),
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    providerEventId: text("provider_event_id"),
    eventType: text("event_type").notNull(),
    amountHalalas: bigint("amount_halalas", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("SAR"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => ({
    orgTypeOccurredIdx: index("payment_events_org_type_occurred_idx").on(
      table.organizationId,
      table.eventType,
      table.occurredAt,
    ),
    providerUnique: uniqueIndex("payment_events_provider_event_id_uq").on(table.providerEventId),
  }),
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventName: text("event_name").notNull(),
    eventDate: date("event_date").notNull(),
    eventAt: timestamp("event_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    orgDateIdx: index("usage_events_org_date_idx").on(table.organizationId, table.eventDate),
    nameDateIdx: index("usage_events_name_date_idx").on(table.eventName, table.eventDate),
    userDateIdx: index("usage_events_user_date_idx").on(table.userId, table.eventDate),
  }),
);

export const dailyOrgMetrics = pgTable(
  "daily_org_metrics",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metricDate: date("metric_date").notNull(),
    dauUsersCount: integer("dau_users_count").notNull().default(0),
    entriesCount: integer("entries_count").notNull().default(0),
    closeoutsSubmittedCount: integer("closeouts_submitted_count").notNull().default(0),
    salesHalalas: bigint("sales_halalas", { mode: "number" }).notNull().default(0),
    outflowHalalas: bigint("outflow_halalas", { mode: "number" }).notNull().default(0),
    netHalalas: bigint("net_halalas", { mode: "number" }).notNull().default(0),
    updatedAt,
  },
  (table) => ({
    pk: primaryKey({
      name: "daily_org_metrics_pk",
      columns: [table.organizationId, table.metricDate],
    }),
  }),
);

export const dailySaasMetrics = pgTable("daily_saas_metrics", {
  metricDate: date("metric_date").primaryKey(),
  activeOrganizationsCount: integer("active_organizations_count").notNull().default(0),
  newOrganizationsCount: integer("new_organizations_count").notNull().default(0),
  churnedOrganizationsCount: integer("churned_organizations_count").notNull().default(0),
  mrrHalalas: bigint("mrr_halalas", { mode: "number" }).notNull().default(0),
  arrHalalas: bigint("arr_halalas", { mode: "number" }).notNull().default(0),
  collectionsHalalas: bigint("collections_halalas", { mode: "number" }).notNull().default(0),
  failedPaymentsCount: integer("failed_payments_count").notNull().default(0),
  updatedAt,
});

export const orgEngagementSnapshots = pgTable(
  "org_engagement_snapshots",
  {
    snapshotDate: date("snapshot_date").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    organizationName: text("organization_name").notNull(),
    organizationStatus: text("organization_status").notNull(),
    subscriptionStatus: text("subscription_status"),
    billingType: text("billing_type").notNull(),
    planCode: text("plan_code"),
    tenureDays: integer("tenure_days").notNull().default(0),
    activeDaysL30: integer("active_days_l30").notNull().default(0),
    activeUsersL30: integer("active_users_l30").notNull().default(0),
    closeoutsL30: integer("closeouts_l30").notNull().default(0),
    entriesL30: integer("entries_l30").notNull().default(0),
    salesHalalasL30: bigint("sales_halalas_l30", { mode: "number" }).notNull().default(0),
    engagementSegment: text("engagement_segment").notNull(),
    lastCoreActivityAt: timestamp("last_core_activity_at", { withTimezone: true }),
    daysSinceLastCoreActivity: integer("days_since_last_core_activity"),
    storesCount: integer("stores_count").notNull().default(0),
    updatedAt,
  },
  (table) => ({
    pk: primaryKey({
      name: "org_engagement_snapshots_pk",
      columns: [table.snapshotDate, table.organizationId],
    }),
    segmentDateIdx: index("org_engagement_snapshots_segment_date_idx").on(
      table.snapshotDate,
      table.engagementSegment,
    ),
    billingDateIdx: index("org_engagement_snapshots_billing_date_idx").on(
      table.snapshotDate,
      table.billingType,
    ),
  }),
);

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
    /** Normalized E.164 login identifier (owners and employees). */
    loginPhone: text("login_phone"),
    username: text("username"),
    passwordHash: text("password_hash"),
    /** When true, owner must set a new password before using the app. */
    mustChangePassword: boolean("must_change_password").notNull().default(false),
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
    loginPhoneProviderUq: uniqueIndex("auth_identities_login_phone_provider_uq")
      .on(table.provider, table.loginPhone)
      .where(sql`${table.loginPhone} IS NOT NULL`),
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

export const stores = pgTable(
  "stores",
  {
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
  },
  (table) => ({
    organizationIdx: index("stores_organization_id_idx").on(table.organizationId),
  }),
);

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
    orgStoreDateCreatedIdIdx: index("daily_closeouts_org_store_date_created_id_idx").on(
      table.organizationId,
      table.storeId,
      table.date,
      table.createdAt,
      table.id,
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

export const attachments = pgTable(
  "attachments",
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
    storageKey: text("storage_key").notNull(),
    originalFileName: text("original_file_name"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt,
  },
  (table) => ({
    orgStoreEntryIdx: index("attachments_org_store_entry_idx").on(
      table.organizationId,
      table.storeId,
      table.entryId,
    ),
  }),
);

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
    orgStoreActionCreatedIdx: index("audit_events_org_store_action_created_idx").on(
      table.organizationId,
      table.storeId,
      table.action,
      table.createdAt,
    ),
  }),
);

export const planCatalog = pgTable("plan_catalog", {
  planCode: text("plan_code").primaryKey(),
  displayNameAr: text("display_name_ar").notNull(),
  displayNameEn: text("display_name_en").notNull(),
  priceMonthlyHalalas: bigint("price_monthly_halalas", { mode: "number" }).notNull(),
  priceYearlyHalalas: bigint("price_yearly_halalas", { mode: "number" }),
  maxStores: integer("max_stores").notNull(),
  maxEmployees: integer("max_employees").notNull(),
  trialDays: integer("trial_days").notNull().default(14),
  features: jsonb("features").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt,
  updatedAt,
});

export const organizationEntitlementOverrides = pgTable(
  "organization_entitlement_overrides",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    maxStoresOverride: integer("max_stores_override"),
    maxEmployeesOverride: integer("max_employees_override"),
    priceMonthlyOverrideHalalas: bigint("price_monthly_override_halalas", { mode: "number" }),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
);

export const accountSetupTokens = pgTable(
  "account_setup_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    ownerName: text("owner_name"),
    tokenHash: text("token_hash").notNull(),
    purpose: text("purpose").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt,
  },
  (table) => ({
    tokenHashUq: uniqueIndex("account_setup_tokens_token_hash_uq").on(table.tokenHash),
    orgCreatedIdx: index("account_setup_tokens_org_created_idx").on(table.organizationId, table.createdAt),
  }),
);

export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceTokenHash: text("device_token_hash").notNull(),
    userAgent: text("user_agent"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (table) => ({
    userRevokedIdx: index("trusted_devices_user_revoked_idx").on(table.userId, table.revokedAt),
    deviceTokenHashUq: uniqueIndex("trusted_devices_device_token_hash_uq").on(table.deviceTokenHash),
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

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt,
  },
  (table) => ({
    tokenHashUq: uniqueIndex("password_reset_tokens_token_hash_uq").on(table.tokenHash),
    userCreatedIdx: index("password_reset_tokens_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export const memberInvitations = pgTable(
  "member_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    phoneNumber: text("phone_number"),
    invitationType: text("invitation_type").notNull().default("employee_onboarding"),
    pinHash: text("pin_hash"),
    activationCodeHash: text("activation_code_hash").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    acceptedUserId: uuid("accepted_user_id").references(() => users.id, { onDelete: "set null" }),
    acceptedMemberId: uuid("accepted_member_id").references(() => organizationMembers.id, {
      onDelete: "set null",
    }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    tokenUq: uniqueIndex("member_invitations_token_uq").on(table.token),
    orgStatusExpiresIdx: index("member_invitations_org_status_expires_idx").on(
      table.organizationId,
      table.status,
      table.expiresAt,
    ),
  }),
);

export const platformAdminGrants = pgTable(
  "platform_admin_grants",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    grantedByUserId: uuid("granted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    grantedAtIdx: index("platform_admin_grants_granted_at_idx").on(table.grantedAt),
  }),
);

export const ownerNotebookNotes = pgTable(
  "owner_notebook_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    kind: text("kind").notNull(),
    done: boolean("done").notNull().default(false),
    color: text("color").notNull().default("yellow"),
    checklist: jsonb("checklist").notNull().default([]),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgUserIdx: index("owner_notebook_notes_org_user_idx").on(
      table.organizationId,
      table.userId,
    ),
    orgUserUpdatedIdx: index("owner_notebook_notes_org_user_updated_idx").on(
      table.organizationId,
      table.userId,
      table.updatedAt,
    ),
  }),
);

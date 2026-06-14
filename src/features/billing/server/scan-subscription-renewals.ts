import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  organizations,
  subscriptionRenewalReminders,
  subscriptions,
} from "@/core/db/schema";
import { isTrialPlanCode } from "@/features/billing/plan-codes";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";
import { buildRenewalReminderWhatsAppMessage } from "@/core/messaging/whatsapp-billing-messages";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";
import {
  resolveDaysUntilPeriodEnd,
  resolveSubscriptionGracePeriodDays,
  resolveSubscriptionPeriodPhase,
  SUBSCRIPTION_REMINDER_TIERS,
} from "@/features/billing/server/subscription-billing-policy";

export type ScanSubscriptionRenewalsResult = {
  scanned: number;
  remindersRecorded: number;
  markedPastDue: number;
  skippedOrganizations: number;
};

async function reminderAlreadySent(input: {
  organizationId: string;
  reminderTier: number;
  periodEnd: Date;
}) {
  const db = getDb();
  const [row] = await db
    .select({ id: subscriptionRenewalReminders.id })
    .from(subscriptionRenewalReminders)
    .where(
      and(
        eq(subscriptionRenewalReminders.organizationId, input.organizationId),
        eq(subscriptionRenewalReminders.reminderTier, input.reminderTier),
        eq(subscriptionRenewalReminders.periodEnd, input.periodEnd),
      ),
    )
    .limit(1);
  return Boolean(row?.id);
}

async function recordRenewalReminder(input: {
  organizationId: string;
  subscriptionId: string;
  reminderTier: number;
  periodEnd: Date;
  channel: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const now = new Date();
  await db.insert(subscriptionRenewalReminders).values({
    organizationId: input.organizationId,
    subscriptionId: input.subscriptionId,
    reminderTier: input.reminderTier,
    channel: input.channel,
    periodEnd: input.periodEnd,
    metadata: input.metadata ?? null,
    createdAt: now,
  });
}

export async function scanSubscriptionRenewals(
  now = new Date(),
): Promise<ScanSubscriptionRenewalsResult> {
  const db = getDb();
  const gracePeriodDays = resolveSubscriptionGracePeriodDays();
  const reminderHorizon = new Date(now);
  reminderHorizon.setUTCDate(reminderHorizon.getUTCDate() + Math.max(...SUBSCRIPTION_REMINDER_TIERS));

  const rows = await db
    .select({
      subscriptionId: subscriptions.id,
      organizationId: subscriptions.organizationId,
      organizationName: organizations.name,
      organizationStatus: organizations.status,
      planCode: subscriptions.planCode,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
    .where(
      and(
        inArray(organizations.status, ["active", "pending_activation"]),
        lte(subscriptions.currentPeriodEnd, reminderHorizon),
        inArray(subscriptions.status, ["active", "trialing"]),
      ),
    )
    .orderBy(desc(subscriptions.updatedAt));

  const seenOrganizations = new Set<string>();
  let remindersRecorded = 0;
  let markedPastDue = 0;
  let skippedOrganizations = 0;

  for (const row of rows) {
    if (seenOrganizations.has(row.organizationId)) continue;
    seenOrganizations.add(row.organizationId);

    if (row.organizationStatus === "suspended" || row.organizationStatus === "archived") {
      skippedOrganizations += 1;
      continue;
    }

    const plan = await getPlanCatalogRow(row.planCode);
    if (!plan) {
      skippedOrganizations += 1;
      continue;
    }

    const isTrialPlan = isTrialPlanCode(row.planCode) || plan.features.isTrialPlan === true;
    const periodEnd = row.currentPeriodEnd;
    const daysUntilEnd = resolveDaysUntilPeriodEnd(periodEnd, now);
    const phase = resolveSubscriptionPeriodPhase({
      subscriptionStatus: row.status,
      periodEnd,
      isTrialPlan,
      gracePeriodDays,
      now,
    });

    const owner = await resolveOrganizationOwnerMember(row.organizationId, db);
    const planDisplayNameAr = plan.displayNameAr;
    const planDisplayNameEn = plan.displayNameEn;

    for (const tier of SUBSCRIPTION_REMINDER_TIERS) {
      if (daysUntilEnd !== tier) continue;
      if (await reminderAlreadySent({
        organizationId: row.organizationId,
        reminderTier: tier,
        periodEnd,
      })) {
        continue;
      }

      const whatsappMessage = buildRenewalReminderWhatsAppMessage({
        ownerName: owner?.name || "",
        organizationName: row.organizationName,
        planDisplayNameAr,
        planDisplayNameEn,
        billingCycle: row.billingCycle,
        daysUntilEnd: tier,
        periodEndIso: periodEnd.toISOString(),
      });

      await recordRenewalReminder({
        organizationId: row.organizationId,
        subscriptionId: row.subscriptionId,
        reminderTier: tier,
        periodEnd,
        channel: "system_scan",
        metadata: {
          whatsappMessage,
          ownerPhone: owner?.loginPhone ?? null,
          billingCycle: row.billingCycle,
        },
      });
      remindersRecorded += 1;
    }

    if (phase === "expired" && (row.status === "active" || row.status === "trialing")) {
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(subscriptions.id, row.subscriptionId));

      if (!await reminderAlreadySent({
        organizationId: row.organizationId,
        reminderTier: 0,
        periodEnd,
      })) {
        const whatsappMessage = buildRenewalReminderWhatsAppMessage({
          ownerName: owner?.name || "",
          organizationName: row.organizationName,
          planDisplayNameAr,
          planDisplayNameEn,
          billingCycle: row.billingCycle,
          daysUntilEnd: 0,
          periodEndIso: periodEnd.toISOString(),
        });
        await recordRenewalReminder({
          organizationId: row.organizationId,
          subscriptionId: row.subscriptionId,
          reminderTier: 0,
          periodEnd,
          channel: "system_scan_expired",
          metadata: {
            whatsappMessage,
            ownerPhone: owner?.loginPhone ?? null,
            billingCycle: row.billingCycle,
            gracePeriodDays,
          },
        });
        remindersRecorded += 1;
      }
      markedPastDue += 1;
    }
  }

  return {
    scanned: seenOrganizations.size,
    remindersRecorded,
    markedPastDue,
    skippedOrganizations,
  };
}

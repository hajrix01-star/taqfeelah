import { randomUUID } from "node:crypto";
import type { PlanCode } from "@/features/billing/plan-codes";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";
import { ensureOwnerLoginPhoneAvailable } from "@/features/auth/server/owner-login-phone-availability";
import { allocateOrganizationAccountNumber } from "@/features/billing/server/allocate-organization-account-number";
import { getDb } from "@/core/db/client";
import { auditEvents, organizations, stores, subscriptions } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";

export type ProvisionOrganizationAccountInput = {
  actorUserId: string;
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  storeName?: string;
  storeLocation?: string;
  planCode: PlanCode;
  activation: "pending_setup_link" | "self_service_signup";
  ownerEmail?: string;
};

export type ProvisionOrganizationAccountResult = {
  organizationId: string;
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  storeId: string;
  storeName: string;
  subscriptionId: string;
  planCode: PlanCode;
  createdAt: Date;
};

export async function provisionOrganizationAccount(
  rawInput: ProvisionOrganizationAccountInput,
): Promise<ProvisionOrganizationAccountResult> {
  let ownerPhone: string;
  try {
    ownerPhone = assertValidLoginPhone(rawInput.ownerPhone);
  } catch {
    throw new ValidationError("Invalid owner phone number.");
  }

  const plan = await getPlanCatalogRow(rawInput.planCode);
  if (!plan) {
    throw new ValidationError("Invalid plan code.");
  }

  const db = getDb();
  const organizationId = randomUUID();
  const storeId = randomUUID();
  const subscriptionId = randomUUID();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + plan.trialDays);

  const organizationName = rawInput.organizationName.trim();
  const ownerName = rawInput.ownerName.trim();
  const storeName = rawInput.storeName?.trim() || organizationName;

  await db.transaction(async (tx) => {
    await ensureOwnerLoginPhoneAvailable(
      {
        phone: ownerPhone,
        excludeUserId: null,
        targetOrganizationId: organizationId,
        actorUserId: rawInput.actorUserId,
      },
      tx,
    );

    const accountNumber = await allocateOrganizationAccountNumber(tx);

    await tx.insert(organizations).values({
      id: organizationId,
      accountNumber,
      name: organizationName,
      status: "pending_activation",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(stores).values({
      id: storeId,
      organizationId,
      name: storeName,
      location: rawInput.storeLocation?.trim() || null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(subscriptions).values({
      id: subscriptionId,
      organizationId,
      planCode: rawInput.planCode,
      status: "trialing",
      billingCycle: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(auditEvents).values({
      organizationId,
      storeId,
      actorUserId: rawInput.actorUserId,
      action: "saas_account_provisioned",
      metadata: {
        organizationName,
        ownerName,
        ownerPhone,
        ownerEmail: rawInput.ownerEmail?.trim().toLowerCase() || null,
        storeId,
        subscriptionId,
        planCode: rawInput.planCode,
        activation: rawInput.activation,
      },
    });
  });

  return {
    organizationId,
    organizationName,
    ownerName,
    ownerPhone,
    storeId,
    storeName,
    subscriptionId,
    planCode: rawInput.planCode,
    createdAt: now,
  };
}

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  authIdentities,
  organizations,
  stores,
  subscriptions,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { createAccountSetupToken } from "@/features/account-setup/server/create-account-setup-token";
import { DEFAULT_PLAN_CODE, PLAN_CODES } from "@/features/billing/plan-codes";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";

function optionalNonEmptyString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(max).optional(),
  );
}

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationName: z.string().trim().min(1, "Organization name is required.").max(120),
  ownerName: z.string().trim().min(1, "Owner name is required.").max(120),
  ownerPhone: z.string().trim().min(1, "Owner phone is required."),
  storeName: optionalNonEmptyString(120),
  storeLocation: optionalNonEmptyString(240),
  planCode: z.enum(PLAN_CODES).default(DEFAULT_PLAN_CODE),
});

function formatCreateSaasAccountValidationMessage(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  for (const items of Object.values(fieldErrors)) {
    const message = items?.find((value) => value.trim());
    if (message) return message;
  }
  return "Invalid SaaS account create input.";
}

export type CreateSaasAccountInput = z.infer<typeof inputSchema>;

export type CreateSaasAccountResult = {
  organizationId: string;
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  setupUrl: string;
  setupExpiresAt: string;
  storeId: string;
  storeName: string;
  subscriptionId: string;
  planCode: string;
  status: "pending_activation";
  createdAt: string;
};

async function assertOwnerPhoneAvailable(phone: string, executor: Pick<ReturnType<typeof getDb>, "select">) {
  const [existing] = await executor
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(eq(authIdentities.loginPhone, phone))
    .limit(1);

  if (existing?.id) {
    throw catalogAppError(ERROR_CODES.OWNER_USERNAME_TAKEN);
  }
}

export async function createSaasAccount(
  rawInput: CreateSaasAccountInput,
  request?: Request,
): Promise<CreateSaasAccountResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(
      formatCreateSaasAccountValidationMessage(parsed.error),
      parsed.error.flatten(),
    );
  }
  const input = parsed.data;

  let ownerPhone: string;
  try {
    ownerPhone = assertValidLoginPhone(input.ownerPhone);
  } catch {
    throw new ValidationError("Invalid owner phone number.");
  }

  const plan = await getPlanCatalogRow(input.planCode);
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

  const storeName = input.storeName?.trim() || input.organizationName.trim();
  const publicOrigin = resolveAppPublicOrigin(request);

  await db.transaction(async (tx) => {
    await assertOwnerPhoneAvailable(ownerPhone, tx);

    await tx.insert(organizations).values({
      id: organizationId,
      name: input.organizationName.trim(),
      status: "pending_activation",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(stores).values({
      id: storeId,
      organizationId,
      name: storeName,
      location: input.storeLocation?.trim() || null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(subscriptions).values({
      id: subscriptionId,
      organizationId,
      planCode: input.planCode,
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
      actorUserId: input.actorUserId,
      action: "saas_account_provisioned",
      metadata: {
        organizationName: input.organizationName.trim(),
        ownerPhone,
        storeId,
        subscriptionId,
        planCode: input.planCode,
        activation: "pending_setup_link",
      },
    });
  });

  const setup = await createAccountSetupToken({
    organizationId,
    phoneNumber: ownerPhone,
    ownerName: input.ownerName.trim(),
    purpose: "onboarding",
    createdByUserId: input.actorUserId,
    publicOrigin,
  });

  return {
    organizationId,
    organizationName: input.organizationName.trim(),
    ownerName: input.ownerName.trim(),
    ownerPhone,
    setupUrl: setup.setupUrl,
    setupExpiresAt: setup.expiresAt,
    storeId,
    storeName,
    subscriptionId,
    planCode: input.planCode,
    status: "pending_activation" as const,
    createdAt: now.toISOString(),
  };
}

import { z } from "zod";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { ValidationError } from "@/core/errors/app-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { createAccountSetupToken } from "@/features/account-setup/server/create-account-setup-token";
import { DEFAULT_PLAN_CODE, PLAN_CODES } from "@/features/billing/plan-codes";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";
import { provisionOrganizationAccount } from "@/features/saas-admin/server/provision-organization-account";

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

  try {
    assertValidLoginPhone(input.ownerPhone);
  } catch {
    throw new ValidationError("Invalid owner phone number.");
  }

  const plan = await getPlanCatalogRow(input.planCode);
  if (!plan) {
    throw new ValidationError("Invalid plan code.");
  }

  const publicOrigin = resolveAppPublicOrigin(request);

  const provisioned = await provisionOrganizationAccount({
    actorUserId: input.actorUserId,
    organizationName: input.organizationName,
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    storeName: input.storeName,
    storeLocation: input.storeLocation,
    planCode: input.planCode,
    activation: "pending_setup_link",
  });

  const setup = await createAccountSetupToken({
    organizationId: provisioned.organizationId,
    phoneNumber: provisioned.ownerPhone,
    ownerName: provisioned.ownerName,
    purpose: "onboarding",
    createdByUserId: input.actorUserId,
    publicOrigin,
  });

  return {
    organizationId: provisioned.organizationId,
    organizationName: provisioned.organizationName,
    ownerName: provisioned.ownerName,
    ownerPhone: provisioned.ownerPhone,
    setupUrl: setup.setupUrl,
    setupExpiresAt: setup.expiresAt,
    storeId: provisioned.storeId,
    storeName: provisioned.storeName,
    subscriptionId: provisioned.subscriptionId,
    planCode: provisioned.planCode,
    status: "pending_activation" as const,
    createdAt: provisioned.createdAt.toISOString(),
  };
}

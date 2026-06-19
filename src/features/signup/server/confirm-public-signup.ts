import { eq } from "drizzle-orm";
import { z } from "zod";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { isPublicSignupAvailable } from "@/core/config/public-signup-mode";
import { sendTransactionalEmail } from "@/core/email/send-transactional-email";
import { getDb } from "@/core/db/client";
import { signupRequests } from "@/core/db/schema";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { createAccountSetupToken } from "@/features/account-setup/server/create-account-setup-token";
import { provisionOrganizationAccount } from "@/features/saas-admin/server/provision-organization-account";
import { requireSignupSystemActorUserId } from "@/features/signup/server/resolve-signup-system-actor";
import { buildSignupWelcomeSetupEmailContent } from "@/features/signup/server/signup-email";
import { hashSignupVerificationToken } from "@/features/signup/server/signup-token";
import { DEFAULT_PLAN_CODE, parsePlanCode } from "@/features/billing/plan-codes";

const inputSchema = z.object({
  token: z.string().trim().min(16).max(200),
});

export async function confirmPublicSignup(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  if (!isPublicSignupAvailable()) {
    throw new ServiceUnavailableError("Public signup is not enabled.");
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid signup verification token.");
  }

  const tokenHash = hashSignupVerificationToken(parsed.data.token.trim());
  const db = getDb();
  const now = new Date();

  const [signupRow] = await db
    .select()
    .from(signupRequests)
    .where(eq(signupRequests.tokenHash, tokenHash))
    .limit(1);

  if (!signupRow) {
    throw new ValidationError("Signup verification link is invalid or expired.");
  }

  if (signupRow.status === "verified" && signupRow.organizationId) {
    const setup = await createAccountSetupToken({
      organizationId: signupRow.organizationId,
      phoneNumber: signupRow.ownerPhone,
      ownerName: signupRow.ownerName,
      ownerEmail: signupRow.email,
      purpose: "onboarding",
      createdByUserId: requireSignupSystemActorUserId(),
      publicOrigin: resolveAppPublicOrigin(request),
    });

    return {
      organizationId: signupRow.organizationId,
      setupUrl: setup.setupUrl,
      setupExpiresAt: setup.expiresAt,
      alreadyVerified: true as const,
    };
  }

  if (signupRow.status !== "pending_verification") {
    throw new ValidationError("Signup verification link is invalid or expired.");
  }

  if (signupRow.expiresAt.getTime() < Date.now()) {
    await db
      .update(signupRequests)
      .set({ status: "expired" })
      .where(eq(signupRequests.id, signupRow.id));
    throw new ValidationError("Signup verification link has expired.");
  }

  const planCode = parsePlanCode(signupRow.planCode) ?? DEFAULT_PLAN_CODE;
  const actorUserId = requireSignupSystemActorUserId();

  const provisioned = await provisionOrganizationAccount({
    actorUserId,
    organizationName: signupRow.organizationName,
    ownerName: signupRow.ownerName,
    ownerPhone: signupRow.ownerPhone,
    storeName: signupRow.storeName ?? undefined,
    planCode,
    activation: "self_service_signup",
    ownerEmail: signupRow.email,
  });

  const setup = await createAccountSetupToken({
    organizationId: provisioned.organizationId,
    phoneNumber: provisioned.ownerPhone,
    ownerName: provisioned.ownerName,
    ownerEmail: signupRow.email,
    purpose: "onboarding",
    createdByUserId: actorUserId,
    publicOrigin: resolveAppPublicOrigin(request),
  });

  await db
    .update(signupRequests)
    .set({
      status: "verified",
      verifiedAt: now,
      organizationId: provisioned.organizationId,
    })
    .where(eq(signupRequests.id, signupRow.id));

  const welcomeEmail = buildSignupWelcomeSetupEmailContent(
    setup.setupUrl,
    provisioned.organizationName,
  );

  await sendTransactionalEmail({
    to: signupRow.email,
    subject: welcomeEmail.subject,
    html: welcomeEmail.html,
    text: welcomeEmail.text,
  });

  return {
    organizationId: provisioned.organizationId,
    setupUrl: setup.setupUrl,
    setupExpiresAt: setup.expiresAt,
    alreadyVerified: false as const,
  };
}

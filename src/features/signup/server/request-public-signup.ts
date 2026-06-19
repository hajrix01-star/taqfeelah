import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { isPublicSignupAvailable } from "@/core/config/public-signup-mode";
import { sendTransactionalEmail } from "@/core/email/send-transactional-email";
import { getDb } from "@/core/db/client";
import { signupRequests } from "@/core/db/schema";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { DEFAULT_PLAN_CODE, PLAN_CODES } from "@/features/billing/plan-codes";
import { ensureOwnerLoginPhoneAvailable } from "@/features/auth/server/owner-login-phone-availability";
import { isOwnerSignupEmailTaken } from "@/features/signup/server/owner-signup-email-availability";
import { requireSignupSystemActorUserId } from "@/features/signup/server/resolve-signup-system-actor";
import {
  buildSignupVerificationEmailContent,
} from "@/features/signup/server/signup-email";
import {
  buildSignupVerificationUrl,
  generateSignupVerificationToken,
  hashSignupVerificationToken,
  normalizeSignupEmail,
} from "@/features/signup/server/signup-token";

const SIGNUP_TOKEN_TTL_HOURS = 24;

const inputSchema = z.object({
  organizationName: z.string().trim().min(1, "Organization name is required.").max(120),
  ownerName: z.string().trim().min(1, "Owner name is required.").max(120),
  ownerPhone: z.string().trim().min(1, "Owner phone is required."),
  email: z.string().trim().email("A valid email address is required."),
  storeName: z.string().trim().max(120).optional(),
  planCode: z.enum(PLAN_CODES).default(DEFAULT_PLAN_CODE),
});

function formatValidationMessage(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  for (const items of Object.values(fieldErrors)) {
    const message = items?.find((value) => value.trim());
    if (message) return message;
  }
  return "Invalid signup request.";
}

export async function requestPublicSignup(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  if (!isPublicSignupAvailable()) {
    throw new ServiceUnavailableError("Public signup is not enabled.");
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(formatValidationMessage(parsed.error), parsed.error.flatten());
  }
  const input = parsed.data;

  let ownerPhone: string;
  try {
    ownerPhone = assertValidLoginPhone(input.ownerPhone);
  } catch {
    throw new ValidationError("Invalid owner phone number.");
  }

  const email = normalizeSignupEmail(input.email);
  const actorUserId = requireSignupSystemActorUserId();
  const genericResponse = {
    success: true,
    message: "If signup is available, a confirmation email has been sent.",
  };

  if (await isOwnerSignupEmailTaken(email)) {
    return genericResponse;
  }

  const db = getDb();
  try {
    await ensureOwnerLoginPhoneAvailable(
      {
        phone: ownerPhone,
        excludeUserId: null,
        targetOrganizationId: randomUUID(),
        actorUserId,
      },
      db,
    );
  } catch {
    return genericResponse;
  }

  const rawToken = generateSignupVerificationToken();
  const tokenHash = hashSignupVerificationToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SIGNUP_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const verifyUrl = buildSignupVerificationUrl(rawToken, request);
  const emailContent = buildSignupVerificationEmailContent(verifyUrl);

  await db.transaction(async (tx) => {
    await tx
      .update(signupRequests)
      .set({ status: "superseded" })
      .where(
        and(
          eq(signupRequests.email, email),
          eq(signupRequests.status, "pending_verification"),
        ),
      );

    await tx.insert(signupRequests).values({
      id: randomUUID(),
      email,
      organizationName: input.organizationName.trim(),
      ownerName: input.ownerName.trim(),
      ownerPhone,
      storeName: input.storeName?.trim() || null,
      planCode: input.planCode,
      tokenHash,
      status: "pending_verification",
      expiresAt,
      createdAt: now,
    });
  });

  await sendTransactionalEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return genericResponse;
}

export async function findActivePendingSignupByEmail(email: string) {
  const normalizedEmail = normalizeSignupEmail(email);
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(signupRequests)
    .where(
      and(
        eq(signupRequests.email, normalizedEmail),
        eq(signupRequests.status, "pending_verification"),
        gt(signupRequests.expiresAt, now),
      ),
    )
    .limit(1);
  return row ?? null;
}

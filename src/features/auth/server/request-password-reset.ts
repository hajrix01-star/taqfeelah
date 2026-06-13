import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isPasswordResetEnabled } from "@/core/config/password-reset-mode";
import { sendTransactionalEmail } from "@/core/email/send-transactional-email";
import { getDb } from "@/core/db/client";
import { auditEvents, passwordResetTokens } from "@/core/db/schema";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/features/auth/server/password-reset-token";
import {
  PASSWORD_RESET_AUDIENCES,
  resolvePasswordResetAuditOrganizationId,
  resolvePasswordResetUserId,
  type PasswordResetAudience,
} from "@/features/auth/server/password-reset-audience";
import {
  buildPasswordResetEmailContent,
  buildPasswordResetUrl,
} from "@/features/auth/server/password-reset-email";

const RESET_TOKEN_TTL_SECONDS = 60 * 60;

const inputSchema = z.object({
  email: z.string().trim().email("A valid email address is required."),
  audience: z.enum(PASSWORD_RESET_AUDIENCES),
});

export async function requestPasswordReset(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  if (!isPasswordResetEnabled()) {
    throw new ServiceUnavailableError("Password reset is not enabled.");
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid password reset request.", parsed.error.flatten());
  }

  const email = parsed.data.email.trim().toLowerCase();
  const audience = parsed.data.audience;
  const userId = await resolvePasswordResetUserId(email, audience);
  const genericResponse = {
    success: true,
    message: "If an account exists for this email, a reset link has been sent.",
  };

  if (!userId) {
    return genericResponse;
  }

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_SECONDS * 1000);
  const resetUrl = buildPasswordResetUrl(rawToken, audience, request);
  const emailContent = buildPasswordResetEmailContent(resetUrl, audience);
  const auditAction = audience === "platform_admin"
    ? "platform_admin_password_reset_requested"
    : "owner_password_reset_requested";

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    await tx.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });

    await tx.insert(auditEvents).values({
      organizationId: await resolvePasswordResetAuditOrganizationId(userId, audience),
      actorUserId: userId,
      action: auditAction,
      metadata: {
        email,
        audience,
        expiresAt: expiresAt.toISOString(),
      },
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

export type { PasswordResetAudience };

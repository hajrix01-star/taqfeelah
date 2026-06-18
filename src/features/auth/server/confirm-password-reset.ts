import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { isPasswordResetAvailable } from "@/core/config/password-reset-mode";
import { getDb } from "@/core/db/client";
import { auditEvents, passwordResetTokens } from "@/core/db/schema";
import { ServiceUnavailableError, UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import {
  clearOwnerMustChangePassword,
  getOwnerPasswordIdentityFlags,
  upsertOwnerPasswordIdentity,
} from "@/features/auth/server/auth-identities";
import { hashPasswordResetToken } from "@/features/auth/server/password-reset-token";
import {
  PASSWORD_RESET_AUDIENCES,
  assertPasswordResetUserAudience,
  resolvePasswordResetAuditOrganizationId,
  type PasswordResetAudience,
} from "@/features/auth/server/password-reset-audience";
import { passwordSchema } from "@/core/auth/password-policy";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
  audience: z.enum(PASSWORD_RESET_AUDIENCES),
});

export async function confirmPasswordReset(rawInput: z.infer<typeof inputSchema>) {
  if (!isPasswordResetEnabled()) {
    throw new ServiceUnavailableError("Password reset is not enabled.");
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid password reset confirmation.", parsed.error.flatten());
  }

  const input = parsed.data;
  if (input.newPassword !== input.confirmPassword) {
    throw new ValidationError("Password confirmation does not match.");
  }

  const tokenHash = hashPasswordResetToken(input.token);
  const db = getDb();
  const now = new Date();

  const [tokenRow] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  if (!tokenRow || tokenRow.expiresAt <= now) {
    throw new UnauthorizedError("Reset link is invalid or expired.");
  }

  await assertPasswordResetUserAudience(tokenRow.userId, input.audience);

  const identity = await getOwnerPasswordIdentityFlags(tokenRow.userId);
  const username = identity?.username?.trim();
  if (!username) {
    throw new ValidationError("Login credentials are not configured.");
  }

  const auditAction = input.audience === "platform_admin"
    ? "platform_admin_password_reset_completed"
    : "owner_password_reset_completed";

  await db.transaction(async (tx) => {
    await upsertOwnerPasswordIdentity({
      userId: tokenRow.userId,
      username,
      password: input.newPassword,
      phoneNumber: identity.phoneNumber || undefined,
      mustChangePassword: false,
    }, tx);

    await clearOwnerMustChangePassword(tokenRow.userId, tx);

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, tokenRow.id));

    await tx.insert(auditEvents).values({
      organizationId: await resolvePasswordResetAuditOrganizationId(tokenRow.userId, input.audience),
      actorUserId: tokenRow.userId,
      action: auditAction,
      metadata: {
        tokenId: tokenRow.id,
        audience: input.audience,
      },
    });
  });

  return { success: true };
}

export type { PasswordResetAudience };

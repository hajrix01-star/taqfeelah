import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { isPasswordResetEnabled } from "@/core/config/password-reset-mode";
import { getDb } from "@/core/db/client";
import { auditEvents, organizationMembers, passwordResetTokens } from "@/core/db/schema";
import { ServiceUnavailableError, UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { clearOwnerMustChangePassword, getOwnerPasswordIdentityFlags, upsertOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";
import { hashPasswordResetToken } from "@/features/auth/server/password-reset-token";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
  newPassword: z.string().trim().min(6).max(120),
  confirmPassword: z.string().trim().min(6).max(120),
});

export async function confirmOwnerPasswordReset(rawInput: z.infer<typeof inputSchema>) {
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

  const [ownerMember] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, tokenRow.userId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!ownerMember) {
    throw new UnauthorizedError("Reset link is invalid or expired.");
  }

  const identity = await getOwnerPasswordIdentityFlags(tokenRow.userId);
  const username = identity?.username?.trim();
  if (!username) {
    throw new ValidationError("Owner credentials are not configured.");
  }

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
      organizationId: ownerMember.organizationId,
      actorUserId: tokenRow.userId,
      action: "owner_password_reset_completed",
      metadata: {
        tokenId: tokenRow.id,
      },
    });
  });

  return { success: true };
}

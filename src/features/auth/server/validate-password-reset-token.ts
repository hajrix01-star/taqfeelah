import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { passwordResetTokens } from "@/core/db/schema";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { hashPasswordResetToken } from "@/features/auth/server/password-reset-token";
import {
  PASSWORD_RESET_AUDIENCES,
  assertPasswordResetUserAudience,
  type PasswordResetAudience,
} from "@/features/auth/server/password-reset-audience";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
  audience: z.enum(PASSWORD_RESET_AUDIENCES).optional(),
});

export async function validatePasswordResetToken(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid reset token.", parsed.error.flatten());
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const db = getDb();
  const [tokenRow] = await db
    .select({
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

  const now = new Date();
  const tokenValid = Boolean(tokenRow && tokenRow.expiresAt > now);

  if (!tokenValid) {
    return {
      valid: false,
      status: !tokenRow ? "invalid" : tokenRow.usedAt ? "used" : tokenRow.expiresAt <= now ? "expired" : "invalid",
    };
  }

  const audience = parsed.data.audience;
  if (audience) {
    try {
      await assertPasswordResetUserAudience(tokenRow!.userId, audience);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return { valid: false, status: "invalid" as const };
      }
      throw error;
    }
  }

  return {
    valid: true,
    status: "valid" as const,
  };
}

export type { PasswordResetAudience };

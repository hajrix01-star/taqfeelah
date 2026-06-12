import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { passwordResetTokens } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { hashPasswordResetToken } from "@/features/auth/server/password-reset-token";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
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
  const valid = Boolean(tokenRow && tokenRow.expiresAt > now);

  return {
    valid,
    status: !tokenRow ? "invalid" : tokenRow.usedAt ? "used" : tokenRow.expiresAt <= now ? "expired" : "valid",
  };
}

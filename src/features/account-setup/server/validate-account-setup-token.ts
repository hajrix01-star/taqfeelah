import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { accountSetupTokens, organizations } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { hashAccountSetupToken } from "@/features/account-setup/server/account-setup-token";
import type { AccountSetupTokenPreview } from "@/features/account-setup/types";

const inputSchema = z.object({
  token: z.string().trim().min(16).max(200),
});

export async function validateAccountSetupToken(
  rawInput: z.infer<typeof inputSchema>,
): Promise<AccountSetupTokenPreview & { tokenId: string; organizationId: string; userId: string | null }> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid setup token.", parsed.error.flatten());
  }

  const tokenHash = hashAccountSetupToken(parsed.data.token.trim());
  const db = getDb();

  const [row] = await db
    .select({
      id: accountSetupTokens.id,
      organizationId: accountSetupTokens.organizationId,
      userId: accountSetupTokens.userId,
      phoneNumber: accountSetupTokens.phoneNumber,
      ownerName: accountSetupTokens.ownerName,
      ownerEmail: accountSetupTokens.ownerEmail,
      purpose: accountSetupTokens.purpose,
      expiresAt: accountSetupTokens.expiresAt,
      usedAt: accountSetupTokens.usedAt,
    })
    .from(accountSetupTokens)
    .where(eq(accountSetupTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    throw new ValidationError("Setup link is invalid or expired.");
  }
  if (row.usedAt) {
    throw new ValidationError("This setup link has already been used.");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("This setup link has expired.");
  }

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, row.organizationId))
    .limit(1);

  return {
    tokenId: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    purpose: row.purpose as AccountSetupTokenPreview["purpose"],
    phoneNumber: row.phoneNumber,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    organizationName: organization?.name ?? "",
    expiresAt: row.expiresAt.toISOString(),
  };
}

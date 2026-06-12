import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { getDb } from "@/core/db/client";
import { accountSetupTokens } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import {
  buildAccountSetupUrl,
  generateAccountSetupToken,
  hashAccountSetupToken,
} from "@/features/account-setup/server/account-setup-token";
import type { AccountSetupPurpose } from "@/features/account-setup/types";

const SETUP_TOKEN_TTL_HOURS: Record<AccountSetupPurpose, number> = {
  onboarding: 48,
  password_reset: 24,
};

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  phoneNumber: z.string().trim().min(1),
  ownerName: z.string().trim().min(1).max(120).optional(),
  purpose: z.enum(["onboarding", "password_reset"]),
  createdByUserId: z.string().uuid().optional(),
  publicOrigin: z.string().trim().min(1),
});

export async function createAccountSetupToken(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid account setup token input.", parsed.error.flatten());
  }
  const input = parsed.data;

  let phoneNumber: string;
  try {
    phoneNumber = assertValidLoginPhone(input.phoneNumber);
  } catch {
    throw new ValidationError("Invalid owner phone number.");
  }

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + SETUP_TOKEN_TTL_HOURS[input.purpose]);

  await db
    .update(accountSetupTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(accountSetupTokens.organizationId, input.organizationId),
        isNull(accountSetupTokens.usedAt),
      ),
    );

  const token = generateAccountSetupToken();
  const tokenHash = hashAccountSetupToken(token);
  const id = randomUUID();

  await db.insert(accountSetupTokens).values({
    id,
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    phoneNumber,
    ownerName: input.ownerName?.trim() || null,
    tokenHash,
    purpose: input.purpose,
    expiresAt,
    createdByUserId: input.createdByUserId ?? null,
    createdAt: now,
  });

  return {
    tokenId: id,
    setupUrl: buildAccountSetupUrl(token, input.publicOrigin),
    phoneNumber,
    purpose: input.purpose,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function invalidateUnusedSetupTokens(organizationId: string) {
  const db = getDb();
  const now = new Date();
  await db
    .update(accountSetupTokens)
    .set({ usedAt: now })
    .where(
      eq(accountSetupTokens.organizationId, organizationId),
    );
}

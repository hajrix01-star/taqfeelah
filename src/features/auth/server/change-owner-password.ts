import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationMembers } from "@/core/db/schema";
import { and, eq } from "drizzle-orm";
import { ValidationError, UnauthorizedError } from "@/core/errors/app-error";
import {
  clearOwnerMustChangePassword,
  getOwnerPasswordIdentityFlags,
  upsertOwnerPasswordIdentity,
  verifyOwnerPasswordIdentity,
} from "@/features/auth/server/auth-identities";
import { passwordSchema } from "@/core/auth/password-policy";

const inputSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string().trim().min(1).max(120),
  newPassword: passwordSchema,
});

export async function changeOwnerPassword(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid password change input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const [ownerMember] = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, input.userId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!ownerMember) {
    throw new UnauthorizedError("Only active owners can change owner passwords.");
  }

  const identity = await getOwnerPasswordIdentityFlags(input.userId);
  if (!identity?.username) {
    throw new ValidationError("Owner credentials are not configured.");
  }

  const verified = await verifyOwnerPasswordIdentity(identity.username, input.currentPassword);
  if (!verified || verified.userId !== input.userId) {
    throw new UnauthorizedError("Current password is incorrect.");
  }

  if (input.currentPassword === input.newPassword) {
    throw new ValidationError("New password must be different from the current password.");
  }

  await upsertOwnerPasswordIdentity({
    userId: input.userId,
    username: identity.username,
    password: input.newPassword,
    phoneNumber: identity.phoneNumber || undefined,
    mustChangePassword: false,
  });

  await clearOwnerMustChangePassword(input.userId);

  return { success: true };
}

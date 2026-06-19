import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  accountSetupTokens,
  auditEvents,
  organizationMembers,
  organizations,
  stores,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { hashAccountSetupToken } from "@/features/account-setup/server/account-setup-token";
import { upsertOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";
import { provisionSaasAccountFoundation } from "@/features/saas-admin/server/provision-saas-account-foundation";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";

const inputSchema = z.object({
  token: z.string().trim().min(16).max(200),
  password: z.string().trim().min(8).max(120),
  confirmPassword: z.string().trim().min(8).max(120),
});

export async function completeAccountSetup(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid account setup input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (input.password !== input.confirmPassword) {
    throw new ValidationError("Password confirmation does not match.");
  }

  const tokenHash = hashAccountSetupToken(input.token.trim());
  const db = getDb();
  const now = new Date();

  const [tokenRow] = await db
    .select()
    .from(accountSetupTokens)
    .where(eq(accountSetupTokens.tokenHash, tokenHash))
    .limit(1);

  if (!tokenRow) {
    throw new ValidationError("Setup link is invalid or expired.");
  }
  if (tokenRow.usedAt) {
    throw new ValidationError("This setup link has already been used.");
  }
  if (tokenRow.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("This setup link has expired.");
  }

  if (tokenRow.purpose === "onboarding") {
    return completeOnboardingSetup(tokenRow, input.password, now);
  }

  return completePasswordResetSetup(tokenRow, input.password, now);
}

async function completeOnboardingSetup(
  tokenRow: typeof accountSetupTokens.$inferSelect,
  password: string,
  now: Date,
) {
  const db = getDb();
  const ownerUserId = randomUUID();
  const ownerMemberId = randomUUID();

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, tokenRow.organizationId))
    .limit(1);

  if (!organization) {
    throw new ValidationError("Organization not found.");
  }

  const ownerName = tokenRow.ownerName?.trim() || "Owner";
  const loginUsername = tokenRow.ownerEmail?.trim().toLowerCase() || tokenRow.phoneNumber;

  const result = await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: ownerUserId,
      name: ownerName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: ownerMemberId,
      organizationId: tokenRow.organizationId,
      userId: ownerUserId,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await upsertOwnerPasswordIdentity(
      {
        userId: ownerUserId,
        username: loginUsername,
        loginPhone: tokenRow.phoneNumber,
        password,
        phoneNumber: tokenRow.phoneNumber,
        mustChangePassword: false,
      },
      tx,
    );

    await tx
      .update(organizations)
      .set({ status: "active", updatedAt: now })
      .where(eq(organizations.id, tokenRow.organizationId));

    await tx
      .update(accountSetupTokens)
      .set({ usedAt: now, userId: ownerUserId })
      .where(eq(accountSetupTokens.id, tokenRow.id));

    const [store] = await tx
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(
        and(eq(stores.organizationId, tokenRow.organizationId), eq(stores.status, "active")),
      )
      .limit(1);

    if (store && tokenRow.createdByUserId) {
      await provisionSaasAccountFoundation(
        {
          organizationId: tokenRow.organizationId,
          actorUserId: tokenRow.createdByUserId,
          ownerUserId,
          ownerName,
          storeId: store.id,
          storeName: store.name,
        },
        tx,
      );
    }

    await tx.insert(auditEvents).values({
      organizationId: tokenRow.organizationId,
      actorUserId: ownerUserId,
      action: "owner_account_setup_completed",
      metadata: {
        phoneNumber: tokenRow.phoneNumber,
        ownerEmail: tokenRow.ownerEmail,
        purpose: tokenRow.purpose,
      },
    });

    return {
      organizationId: tokenRow.organizationId,
      userId: ownerUserId,
      role: "owner" as const,
      displayName: ownerName,
      loginPhone: tokenRow.phoneNumber,
      mustChangePassword: false,
    };
  });

  return result;
}

async function completePasswordResetSetup(
  tokenRow: typeof accountSetupTokens.$inferSelect,
  password: string,
  now: Date,
) {
  const db = getDb();
  let userId = tokenRow.userId;

  if (!userId) {
    const ownerMember = await resolveOrganizationOwnerMember(tokenRow.organizationId, db);
    userId = ownerMember?.userId ?? null;
  }

  if (!userId) {
    throw new ValidationError("Owner account was not found for password reset.");
  }

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new ValidationError("Owner user was not found.");
  }

  return db.transaction(async (tx) => {
    await upsertOwnerPasswordIdentity(
      {
        userId,
        username: tokenRow.phoneNumber,
        loginPhone: tokenRow.phoneNumber,
        password,
        phoneNumber: tokenRow.phoneNumber,
        mustChangePassword: false,
      },
      tx,
    );

    await tx
      .update(accountSetupTokens)
      .set({ usedAt: now })
      .where(eq(accountSetupTokens.id, tokenRow.id));

    await tx.insert(auditEvents).values({
      organizationId: tokenRow.organizationId,
      actorUserId: userId,
      action: "owner_password_reset_completed",
      metadata: { via: "account_setup_token" },
    });

    return {
      organizationId: tokenRow.organizationId,
      userId,
      role: "owner" as const,
      displayName: user.name,
      loginPhone: tokenRow.phoneNumber,
      mustChangePassword: false,
    };
  });
}

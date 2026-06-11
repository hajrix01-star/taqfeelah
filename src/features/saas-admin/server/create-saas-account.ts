import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  authIdentities,
  organizationMembers,
  organizations,
  stores,
  subscriptions,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { upsertOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";

const PLAN_CODES = ["starter", "growth", "enterprise"] as const;
const TRIAL_DAYS = 14;

function optionalNonEmptyString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(max).optional(),
  );
}

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationName: z.string().trim().min(1, "Organization name is required.").max(120),
  ownerName: z.string().trim().min(1, "Owner name is required.").max(120),
  ownerUsername: z.string().trim().min(1, "Username is required.").max(120),
  ownerPassword: z
    .string()
    .trim()
    .min(4, "Password must be at least 4 characters.")
    .max(120),
  storeName: optionalNonEmptyString(120),
  storeLocation: optionalNonEmptyString(240),
  planCode: z.enum(PLAN_CODES).default("starter"),
});

function formatCreateSaasAccountValidationMessage(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  for (const items of Object.values(fieldErrors)) {
    const message = items?.find((value) => value.trim());
    if (message) return message;
  }
  return "Invalid SaaS account create input.";
}

export type CreateSaasAccountInput = z.infer<typeof inputSchema>;

export type CreateSaasAccountResult = {
  organizationId: string;
  organizationName: string;
  ownerUserId: string;
  ownerMemberId: string;
  ownerUsername: string;
  storeId: string;
  storeName: string;
  subscriptionId: string;
  planCode: string;
  status: "trial";
  createdAt: string;
};

async function assertOwnerUsernameAvailable(username: string, executor: Pick<ReturnType<typeof getDb>, "select">) {
  const normalized = username.trim().toLowerCase();
  const [existing] = await executor
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.username, normalized),
      ),
    )
    .limit(1);

  if (existing?.id) {
    throw new ValidationError("Owner username is already taken.");
  }
}

export async function createSaasAccount(rawInput: CreateSaasAccountInput): Promise<CreateSaasAccountResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(
      formatCreateSaasAccountValidationMessage(parsed.error),
      parsed.error.flatten(),
    );
  }
  const input = parsed.data;

  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const organizationId = randomUUID();
  const ownerUserId = randomUUID();
  const ownerMemberId = randomUUID();
  const storeId = randomUUID();
  const subscriptionId = randomUUID();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + TRIAL_DAYS);

  const storeName = input.storeName?.trim() || input.organizationName.trim();
  const ownerUsername = input.ownerUsername.trim().toLowerCase();

  return db.transaction(async (tx) => {
    await assertOwnerUsernameAvailable(ownerUsername, tx);

    await tx.insert(organizations).values({
      id: organizationId,
      name: input.organizationName.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(users).values({
      id: ownerUserId,
      name: input.ownerName.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: ownerMemberId,
      organizationId,
      userId: ownerUserId,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await upsertOwnerPasswordIdentity(
      {
        userId: ownerUserId,
        username: ownerUsername,
        password: input.ownerPassword,
      },
      tx,
    );

    await tx.insert(stores).values({
      id: storeId,
      organizationId,
      name: storeName,
      location: input.storeLocation?.trim() || null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(subscriptions).values({
      id: subscriptionId,
      organizationId,
      planCode: input.planCode,
      status: "trialing",
      billingCycle: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(auditEvents).values({
      organizationId,
      storeId,
      actorUserId: input.actorUserId,
      action: "saas_account_provisioned",
      metadata: {
        organizationName: input.organizationName.trim(),
        ownerUserId,
        ownerMemberId,
        ownerUsername,
        storeId,
        subscriptionId,
        planCode: input.planCode,
      },
    });

    return {
      organizationId,
      organizationName: input.organizationName.trim(),
      ownerUserId,
      ownerMemberId,
      ownerUsername,
      storeId,
      storeName,
      subscriptionId,
      planCode: input.planCode,
      status: "trial" as const,
      createdAt: now.toISOString(),
    };
  });
}

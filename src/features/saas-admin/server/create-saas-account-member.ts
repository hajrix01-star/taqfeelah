import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  memberStoreAccess,
  organizationMembers,
  organizations,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { ensureEmployeeLoginPhoneAvailable } from "@/features/auth/server/employee-login-phone-availability";
import { upsertEmployeePinIdentity } from "@/features/auth/server/auth-identities";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import { assertSaasMemberStoreIds } from "@/features/saas-admin/server/assert-saas-member-store-ids";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["manager", "employee"]),
  pin: z.string().trim().min(4).max(12),
  loginPhone: z.string().trim().min(1).max(30).optional(),
  storeIds: z.array(z.string().uuid()).default([]),
});

export type CreateSaasAccountMemberInput = z.infer<typeof inputSchema>;

export type CreateSaasAccountMemberResult = {
  memberId: string;
  userId: string;
  name: string;
  role: "manager" | "employee";
  status: "active";
  storeIds: string[];
  createdAt: string;
  updatedAt: string;
};

export async function createSaasAccountMember(
  rawInput: CreateSaasAccountMemberInput,
): Promise<CreateSaasAccountMemberResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS member create input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();

  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization?.id) {
    throw catalogAppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
  }

  await assertOrganizationEntitlement(input.organizationId, "invite_employee");
  const uniqueStoreIds = await assertSaasMemberStoreIds(db, input.organizationId, input.storeIds);

  const userId = randomUUID();
  const memberId = randomUUID();
  const now = new Date();

  let normalizedLoginPhone: string | undefined;
  if (input.loginPhone) {
    try {
      normalizedLoginPhone = assertValidLoginPhone(input.loginPhone);
    } catch {
      throw new ValidationError("Invalid employee login phone number.");
    }
  }

  return db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: input.name,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: memberId,
      organizationId: input.organizationId,
      userId,
      role: input.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    if (uniqueStoreIds.length) {
      await tx.insert(memberStoreAccess).values(
        uniqueStoreIds.map((storeId) => ({
          organizationMemberId: memberId,
          storeId,
        })),
      );
    }

    if (normalizedLoginPhone) {
      await ensureEmployeeLoginPhoneAvailable(
        { phone: normalizedLoginPhone, excludeUserId: userId },
        tx,
      );
    }

    await upsertEmployeePinIdentity(
      { userId, pin: input.pin, loginPhone: normalizedLoginPhone },
      tx,
    );

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "saas_member_provisioned",
      metadata: {
        memberId,
        userId,
        role: input.role,
        storeIds: uniqueStoreIds,
        loginPhone: normalizedLoginPhone || null,
      },
    });

    return {
      memberId,
      userId,
      name: input.name,
      role: input.role,
      status: "active" as const,
      loginPhone: normalizedLoginPhone ?? null,
      storeIds: uniqueStoreIds,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

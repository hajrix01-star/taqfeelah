import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  authIdentities,
  organizationMembers,
  organizations,
} from "@/core/db/schema";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";

type DbExecutor = Pick<ReturnType<typeof getDb>, "select" | "update" | "insert">;

export type OwnerLoginPhoneHolder = {
  identityId: string;
  userId: string;
  username: string | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationStatus: string | null;
  ownerMemberStatus: string | null;
};

export async function findUsernamePasswordLoginPhoneHolder(
  phone: string,
  executor: Pick<ReturnType<typeof getDb>, "select"> = getDb(),
): Promise<OwnerLoginPhoneHolder | null> {
  const [identity] = await executor
    .select({
      identityId: authIdentities.id,
      userId: authIdentities.userId,
      username: authIdentities.username,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.loginPhone, phone),
      ),
    )
    .limit(1);

  if (!identity?.identityId) return null;

  const [ownerMembership] = await executor
    .select({
      organizationId: organizationMembers.organizationId,
      ownerMemberStatus: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, identity.userId),
        eq(organizationMembers.role, "owner"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt))
    .limit(1);

  if (!ownerMembership?.organizationId) {
    return {
      identityId: identity.identityId,
      userId: identity.userId,
      username: identity.username,
      organizationId: null,
      organizationName: null,
      organizationStatus: null,
      ownerMemberStatus: null,
    };
  }

  const [organization] = await executor
    .select({
      organizationName: organizations.name,
      organizationStatus: organizations.status,
    })
    .from(organizations)
    .where(eq(organizations.id, ownerMembership.organizationId))
    .limit(1);

  return {
    identityId: identity.identityId,
    userId: identity.userId,
    username: identity.username,
    organizationId: ownerMembership.organizationId,
    organizationName: organization?.organizationName ?? null,
    organizationStatus: organization?.organizationStatus ?? null,
    ownerMemberStatus: ownerMembership.ownerMemberStatus,
  };
}

async function releaseOwnerLoginPhoneHolder(
  holder: OwnerLoginPhoneHolder,
  input: {
    actorUserId: string;
    targetOrganizationId: string;
    phone: string;
    reason: string;
  },
  executor: DbExecutor,
) {
  const now = new Date();
  const nextUsername =
    holder.username?.trim() === input.phone ? `released-${holder.identityId.slice(0, 8)}` : holder.username;

  await executor
    .update(authIdentities)
    .set({
      loginPhone: null,
      phoneNumber: null,
      username: nextUsername,
      updatedAt: now,
    })
    .where(eq(authIdentities.id, holder.identityId));

  await executor.insert(auditEvents).values({
    organizationId: holder.organizationId ?? input.targetOrganizationId,
    actorUserId: input.actorUserId,
    action: "owner_login_phone_released",
    metadata: {
      releasedUserId: holder.userId,
      releasedFromOrganizationId: holder.organizationId,
      phone: input.phone,
      reason: input.reason,
      reassignedToOrganizationId: input.targetOrganizationId,
    },
  });
}

function canReuseOwnerLoginPhone(
  holder: OwnerLoginPhoneHolder,
  excludeUserId: string | null,
  targetOrganizationId: string,
): string | null {
  if (excludeUserId && holder.userId === excludeUserId) {
    return null;
  }

  if (holder.organizationStatus === "archived") {
    return "archived_organization";
  }

  if (
    holder.organizationId === targetOrganizationId
    && holder.ownerMemberStatus
    && holder.ownerMemberStatus !== "active"
  ) {
    return "inactive_owner_member";
  }

  return null;
}

export async function ensureOwnerLoginPhoneAvailable(
  input: {
    phone: string;
    excludeUserId: string | null;
    targetOrganizationId: string;
    actorUserId: string;
  },
  executor: DbExecutor,
) {
  const holder = await findUsernamePasswordLoginPhoneHolder(input.phone, executor);
  if (!holder) return;

  const reuseReason = canReuseOwnerLoginPhone(holder, input.excludeUserId, input.targetOrganizationId);
  if (reuseReason) {
    await releaseOwnerLoginPhoneHolder(
      holder,
      {
        actorUserId: input.actorUserId,
        targetOrganizationId: input.targetOrganizationId,
        phone: input.phone,
        reason: reuseReason,
      },
      executor,
    );
    return;
  }

  if (input.excludeUserId && holder.userId === input.excludeUserId) {
    return;
  }

  throw catalogAppError(ERROR_CODES.OWNER_PHONE_TAKEN, {
    details: {
      conflictingUserId: holder.userId,
      conflictingOrganizationId: holder.organizationId,
      conflictingOrganizationName: holder.organizationName,
      conflictingOrganizationStatus: holder.organizationStatus,
    },
    cause: holder.organizationName
      ? `Owner login phone is already assigned to organization "${holder.organizationName}".`
      : "Owner login phone is already assigned to another account.",
  });
}

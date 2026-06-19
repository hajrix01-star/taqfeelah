import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  authIdentities,
  organizationMembers,
  organizations,
  users,
} from "@/core/db/schema";
import { isEmailLoginIdentifier } from "@/core/auth/email-login-identifier";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import type { OwnerAccountSummary } from "@/features/owner-account/types";

export async function resolveOwnerAccountSummary(input: {
  organizationId: string;
  ownerUserId: string;
}): Promise<OwnerAccountSummary | null> {
  const db = getDb();

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      accountNumber: organizations.accountNumber,
    })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization?.id) return null;

  const [ownerMember] = await db
    .select({
      userId: users.id,
      name: users.name,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.userId, input.ownerUserId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt))
    .limit(1);

  if (!ownerMember?.userId) return null;

  const [identity] = await db
    .select({
      username: authIdentities.username,
      loginPhone: authIdentities.loginPhone,
      phoneNumber: authIdentities.phoneNumber,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, ownerMember.userId),
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  const username = identity?.username?.trim().toLowerCase() || "";
  const loginPhone = identity?.loginPhone?.trim()
    || identity?.phoneNumber?.trim()
    || null;
  const email = username && isEmailLoginIdentifier(username) ? username : null;

  return {
    ownerUserId: ownerMember.userId,
    ownerName: ownerMember.name?.trim() || "",
    organizationId: organization.id,
    accountNumber: organization.accountNumber,
    organizationName: organization.name?.trim() || "",
    email,
    loginPhone,
    loginPhoneDisplay: formatLoginPhoneForDisplay(loginPhone),
    loginMethod: "phone_password",
  };
}

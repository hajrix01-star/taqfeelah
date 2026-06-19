import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers } from "@/core/db/schema";
import { isEmailLoginIdentifier } from "@/core/auth/email-login-identifier";

export type CanonicalOwnerAuth = {
  ownerUsername: string;
  ownerLoginPhone: string;
  ownerEmail: string;
};

export async function resolveOrganizationOwnerAuth(
  organizationId: string,
): Promise<CanonicalOwnerAuth | null> {
  const db = getDb();

  const [owner] = await db
    .select({
      userId: organizationMembers.userId,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt))
    .limit(1);

  if (!owner?.userId) return null;

  const [identity] = await db
    .select({
      username: authIdentities.username,
      loginPhone: authIdentities.loginPhone,
      phoneNumber: authIdentities.phoneNumber,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, owner.userId),
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  if (!identity) return null;

  const username = identity.username?.trim().toLowerCase() || "";
  const loginPhone = identity.loginPhone?.trim() || identity.phoneNumber?.trim() || "";
  const ownerEmail = username && isEmailLoginIdentifier(username) ? username : "";

  return {
    ownerUsername: ownerEmail || username,
    ownerLoginPhone: loginPhone,
    ownerEmail,
  };
}

export function mergeCanonicalOwnerAuthIntoSettings(
  settings: Record<string, unknown> | null | undefined,
  canonicalAuth: CanonicalOwnerAuth | null,
): Record<string, unknown> | null {
  if (!canonicalAuth) {
    return settings && typeof settings === "object" ? settings : null;
  }

  const base = settings && typeof settings === "object" ? { ...settings } : {};
  const currentAuth = base.authConfig;
  const authConfig = {
    ...(currentAuth && typeof currentAuth === "object" ? currentAuth : {}),
    ownerUsername: canonicalAuth.ownerUsername,
    ownerLoginPhone: canonicalAuth.ownerLoginPhone,
    ownerPassword: "",
  };

  const currentContact = base.ownerContact;
  const ownerContact = {
    ...(currentContact && typeof currentContact === "object" ? currentContact : {}),
    email: canonicalAuth.ownerEmail || null,
    loginPhone: canonicalAuth.ownerLoginPhone || null,
  };

  return {
    ...base,
    authConfig,
    ownerContact,
  };
}

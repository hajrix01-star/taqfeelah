import { and, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers } from "@/core/db/schema";
import { normalizeSignupEmail } from "@/features/signup/server/signup-token";

export async function isOwnerSignupEmailTaken(email: string): Promise<boolean> {
  const normalizedEmail = normalizeSignupEmail(email);
  if (!normalizedEmail.includes("@")) return false;

  const db = getDb();
  const [existing] = await db
    .select({ userId: authIdentities.userId })
    .from(authIdentities)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, authIdentities.userId))
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.username, normalizedEmail),
        eq(authIdentities.status, "active"),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  return Boolean(existing?.userId);
}

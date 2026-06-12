import { and, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers } from "@/core/db/schema";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolveOwnerUserIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return null;

  const db = getDb();
  const [identity] = await db
    .select({
      userId: authIdentities.userId,
    })
    .from(authIdentities)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, authIdentities.userId))
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
        eq(authIdentities.username, normalized),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  return identity?.userId ?? null;
}

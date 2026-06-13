import { and, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { hasPlatformAdminGrant } from "@/features/saas-admin/server/platform-admin-grants-repository";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolvePlatformAdminUserIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return null;

  const db = getDb();
  const [identity] = await db
    .select({
      userId: authIdentities.userId,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
        eq(authIdentities.username, normalized),
      ),
    )
    .limit(1);

  if (!identity?.userId) return null;
  if (!(await hasPlatformAdminGrant(identity.userId))) return null;
  return identity.userId;
}

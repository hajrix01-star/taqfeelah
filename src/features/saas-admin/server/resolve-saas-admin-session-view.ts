import { eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { users } from "@/core/db/schema";
import type { AuthSessionClaims } from "@/core/auth/session-cookie";

export type SaasAdminSessionView = {
  userId: string;
  organizationId: string;
  role: AuthSessionClaims["role"];
  displayName: string;
};

export async function resolveSaasAdminSessionView(
  session: AuthSessionClaims,
): Promise<SaasAdminSessionView> {
  const db = getDb();
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    role: session.role,
    displayName: user?.name?.trim() || "",
  };
}

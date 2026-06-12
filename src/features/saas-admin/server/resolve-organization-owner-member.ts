import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers, users } from "@/core/db/schema";

type OwnerMemberRow = {
  memberId: string;
  userId: string;
  name: string;
  memberStatus: string;
  username: string | null;
  loginPhone: string | null;
};

export async function resolveOrganizationOwnerMember(
  organizationId: string,
  executor: Pick<ReturnType<typeof getDb>, "select"> = getDb(),
): Promise<OwnerMemberRow | null> {
  const rows = await executor
    .select({
      memberId: organizationMembers.id,
      userId: organizationMembers.userId,
      name: users.name,
      memberStatus: organizationMembers.status,
      username: authIdentities.username,
      loginPhone: authIdentities.loginPhone,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .leftJoin(
      authIdentities,
      and(
        eq(authIdentities.userId, users.id),
        eq(authIdentities.provider, "username_password"),
      ),
    )
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.role, "owner"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt));

  const active = rows.find((row) => row.memberStatus === "active");
  return active ?? rows[0] ?? null;
}

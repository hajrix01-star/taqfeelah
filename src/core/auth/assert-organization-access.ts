import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationMembers } from "@/core/db/schema";
import { hasAtLeastRole, type MemberRole } from "@/core/auth/roles";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  minimumRole: z.enum(["owner", "manager", "employee"]).default("employee"),
});

export type AssertOrganizationAccessInput = z.infer<typeof inputSchema>;

export type OrganizationAccessContext = {
  memberId: string;
  memberRole: MemberRole;
};

export async function assertOrganizationAccess(
  rawInput: AssertOrganizationAccessInput,
): Promise<OrganizationAccessContext> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid organization access input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const [membership] = await db
    .select({
      id: organizationMembers.id,
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.userId, input.actorUserId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("User is not an active member of this organization.");
  }

  const memberRole = (
    membership.role === "owner" || membership.role === "manager" ? membership.role : "employee"
  ) as MemberRole;

  if (!hasAtLeastRole(memberRole, input.actorRole)) {
    throw new ForbiddenError("Provided role does not match membership privileges.");
  }

  if (!hasAtLeastRole(memberRole, input.minimumRole)) {
    throw new ForbiddenError("Insufficient role for this organization operation.");
  }

  return {
    memberId: membership.id,
    memberRole,
  };
}

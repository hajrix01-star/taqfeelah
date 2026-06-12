import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { createMemberInvitation } from "@/features/member-invitations/server/create-member-invitation";
import { revokeTrustedDevicesForUser } from "@/features/trusted-devices/server/trusted-device-repository";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  memberId: z.string().uuid(),
  pin: z.string().trim().min(4).max(12),
  storeId: z.string().uuid(),
});

export async function resetEmployeeDevicePin(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid device PIN reset input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const [member] = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      name: users.name,
      loginPhone: authIdentities.loginPhone,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .leftJoin(
      authIdentities,
      and(
        eq(authIdentities.userId, organizationMembers.userId),
        eq(authIdentities.provider, "employee_pin"),
      ),
    )
    .where(
      and(
        eq(organizationMembers.id, input.memberId),
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!member?.userId) {
    throw new ValidationError("Member not found.");
  }
  if (member.role !== "employee" && member.role !== "manager") {
    throw new ValidationError("Device PIN reset is only available for staff members.");
  }
  if (!member.loginPhone) {
    throw new ValidationError("Staff member does not have a login phone configured.");
  }

  await revokeTrustedDevicesForUser(member.userId);

  return createMemberInvitation(
    {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      displayName: member.name,
      role: member.role === "manager" ? "manager" : "employee",
      storeId: input.storeId,
      phoneNumber: member.loginPhone,
      pin: input.pin,
      invitationType: "device_pin_reset",
      targetUserId: member.userId,
    },
    request,
  );
}

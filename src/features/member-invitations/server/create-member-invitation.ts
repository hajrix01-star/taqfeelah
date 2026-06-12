import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { buildInviteUrl } from "@/core/auth/app-origin";
import { getDb } from "@/core/db/client";
import { auditEvents, memberInvitations, organizations, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertValidLoginPhone } from "@/core/phone/normalize-login-phone";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import { generateActivationCode } from "@/features/auth/server/activation-code";
import { generateInviteToken } from "@/features/auth/server/invite-token";
import { hashPassword } from "@/features/auth/server/password-hash";
import { INVITATION_EXPIRY_HOURS } from "@/features/member-invitations/server/types";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  displayName: z.string().trim().min(1).max(120),
  role: z.enum(["employee", "manager"]),
  storeId: z.string().uuid(),
  phoneNumber: z.string().trim().min(1),
  pin: z.string().trim().min(4).max(12),
  invitationType: z.enum(["employee_onboarding", "device_pin_reset"]).default("employee_onboarding"),
  targetUserId: z.string().uuid().optional(),
});

export type CreateMemberInvitationInput = z.infer<typeof inputSchema>;

export type CreateMemberInvitationResult = {
  invitationId: string;
  token: string;
  inviteUrl: string;
  pin: string;
  displayName: string;
  role: "employee" | "manager";
  storeId: string;
  storeName: string;
  organizationName: string;
  phoneNumber: string;
  invitationType: "employee_onboarding" | "device_pin_reset";
  status: "pending";
  expiresAt: string;
  createdAt: string;
};

export async function createMemberInvitation(
  rawInput: CreateMemberInvitationInput,
  request?: Request,
): Promise<CreateMemberInvitationResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid member invitation input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  await assertOrganizationEntitlement(input.organizationId, "invite_employee");

  let phoneNumber: string;
  try {
    phoneNumber = assertValidLoginPhone(input.phoneNumber);
  } catch {
    throw new ValidationError("Invalid employee phone number.");
  }

  const db = getDb();
  const [store] = await db
    .select({ id: stores.id, name: stores.name })
    .from(stores)
    .where(
      and(
        eq(stores.id, input.storeId),
        eq(stores.organizationId, input.organizationId),
        eq(stores.status, "active"),
      ),
    )
    .limit(1);

  if (!store) {
    throw new ValidationError("Store is invalid for this organization.");
  }

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization) {
    throw new ValidationError("Organization not found.");
  }

  const pendingRows = await db
    .select({ id: memberInvitations.id })
    .from(memberInvitations)
    .where(
      and(
        eq(memberInvitations.organizationId, input.organizationId),
        inArray(memberInvitations.status, ["pending"]),
      ),
    );

  if (pendingRows.length >= 100) {
    throw new ValidationError("Too many pending invitations. Revoke unused invitations first.");
  }

  const invitationId = randomUUID();
  const token = generateInviteToken();
  const pin = input.pin.trim();
  const pinHash = await hashPassword(pin);
  const activationCode = generateActivationCode(6);
  const activationCodeHash = await hashPassword(activationCode);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);

  await db.transaction(async (tx) => {
    await tx.insert(memberInvitations).values({
      id: invitationId,
      token,
      organizationId: input.organizationId,
      storeId: input.storeId,
      displayName: input.displayName.trim(),
      role: input.role,
      phoneNumber,
      invitationType: input.invitationType,
      pinHash,
      activationCodeHash,
      status: "pending",
      expiresAt,
      createdByUserId: input.actorUserId,
      acceptedUserId: input.targetUserId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      action: "member_invitation_created",
      metadata: {
        invitationId,
        displayName: input.displayName.trim(),
        role: input.role,
        storeId: input.storeId,
        phoneNumber,
        invitationType: input.invitationType,
        expiresAt: expiresAt.toISOString(),
      },
    });
  });

  return {
    invitationId,
    token,
    inviteUrl: buildInviteUrl(token, request),
    pin,
    displayName: input.displayName.trim(),
    role: input.role,
    storeId: input.storeId,
    storeName: store.name,
    organizationName: organization.name,
    phoneNumber,
    invitationType: input.invitationType,
    status: "pending",
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };
}

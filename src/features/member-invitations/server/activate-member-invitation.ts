import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertValidLoginPhone, normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  memberInvitations,
  memberStoreAccess,
  organizationMembers,
  users,
} from "@/core/db/schema";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import { upsertEmployeePinIdentity } from "@/features/auth/server/auth-identities";
import { verifyPassword } from "@/features/auth/server/password-hash";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";
import { INVITATION_MAX_FAILED_ATTEMPTS } from "@/features/member-invitations/server/types";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";
import {
  registerTrustedDevice,
  revokeTrustedDevicesForUser,
} from "@/features/trusted-devices/server/trusted-device-repository";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
  phone: z.string().trim().min(1),
  pin: z.string().trim().min(4).max(12),
  trustDevice: z.boolean().default(true),
});

export async function activateMemberInvitation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid invitation activation input.", parsed.error.flatten());
  }
  const input = parsed.data;

  let normalizedPhone: string;
  try {
    normalizedPhone = assertValidLoginPhone(input.phone);
  } catch {
    throw new ValidationError("Invalid phone number.");
  }

  const db = getDb();
  const [row] = await db
    .select({
      id: memberInvitations.id,
      organizationId: memberInvitations.organizationId,
      storeId: memberInvitations.storeId,
      displayName: memberInvitations.displayName,
      role: memberInvitations.role,
      phoneNumber: memberInvitations.phoneNumber,
      pinHash: memberInvitations.pinHash,
      invitationType: memberInvitations.invitationType,
      status: memberInvitations.status,
      expiresAt: memberInvitations.expiresAt,
      usedAt: memberInvitations.usedAt,
      revokedAt: memberInvitations.revokedAt,
      lockedAt: memberInvitations.lockedAt,
      failedAttempts: memberInvitations.failedAttempts,
      acceptedUserId: memberInvitations.acceptedUserId,
    })
    .from(memberInvitations)
    .where(eq(memberInvitations.token, input.token))
    .limit(1);

  if (!row) {
    throw new ValidationError("Invitation not found.");
  }

  const effectiveStatus = resolveEffectiveInvitationStatus(row);
  if (effectiveStatus === "used") {
    throw new ValidationError("This invitation has already been used.");
  }
  if (effectiveStatus === "revoked") {
    throw new ValidationError("This invitation was cancelled.");
  }
  if (effectiveStatus === "expired") {
    throw new ValidationError("This invitation has expired.");
  }
  if (effectiveStatus === "locked") {
    throw new ValidationError("This invitation is locked after too many failed attempts.");
  }

  const invitationPhone = row.phoneNumber ? normalizeLoginPhone(row.phoneNumber) : "";
  if (!invitationPhone || invitationPhone !== normalizedPhone) {
    throw new ValidationError("Phone number does not match this invitation.");
  }

  const pinHash = row.pinHash;
  if (!pinHash) {
    throw new ValidationError("Invitation is missing PIN configuration.");
  }

  const pinValid = await verifyPassword(input.pin, pinHash);
  if (!pinValid) {
    const nextAttempts = row.failedAttempts + 1;
    const now = new Date();
    const shouldLock = nextAttempts >= INVITATION_MAX_FAILED_ATTEMPTS;

    await db
      .update(memberInvitations)
      .set({
        failedAttempts: nextAttempts,
        status: shouldLock ? "locked" : "pending",
        lockedAt: shouldLock ? now : row.lockedAt,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    throw new UnauthorizedError(
      shouldLock
        ? "Too many failed attempts. This invitation is now locked."
        : "Invalid PIN.",
    );
  }

  if (row.invitationType === "device_pin_reset") {
    return completeDevicePinReset(row, normalizedPhone, input.pin, input.trustDevice);
  }

  await assertOrganizationEntitlement(row.organizationId, "activate_employee");

  const userId = randomUUID();
  const memberId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: row.displayName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: memberId,
      organizationId: row.organizationId,
      userId,
      role: row.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(memberStoreAccess).values({
      organizationMemberId: memberId,
      storeId: row.storeId,
    });

    await upsertEmployeePinIdentity(
      { userId, pin: input.pin, loginPhone: normalizedPhone },
      tx,
    );

    await tx
      .update(memberInvitations)
      .set({
        status: "used",
        usedAt: now,
        acceptedUserId: userId,
        acceptedMemberId: memberId,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    await tx.insert(auditEvents).values({
      organizationId: row.organizationId,
      storeId: row.storeId,
      actorUserId: userId,
      action: "member_invitation_activated",
      metadata: {
        invitationId: row.id,
        memberId,
        userId,
        role: row.role,
      },
    });
  });

  const displayName = await resolveUserDisplayName(userId);
  const trustedDevice = input.trustDevice
    ? await registerTrustedDevice({ userId })
    : null;

  return {
    organizationId: row.organizationId,
    userId,
    memberId,
    role: row.role as "employee" | "manager",
    storeId: row.storeId,
    displayName,
    trustedDevice,
  };
}

async function completeDevicePinReset(
  row: {
    id: string;
    organizationId: string;
    storeId: string;
    displayName: string;
    role: string;
    acceptedUserId: string | null;
  },
  loginPhone: string,
  pin: string,
  trustDevice: boolean,
) {
  const userId = row.acceptedUserId;
  if (!userId) {
    throw new ValidationError("Device PIN reset invitation is missing target user.");
  }

  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await upsertEmployeePinIdentity({ userId, pin, loginPhone }, tx);
    await revokeTrustedDevicesForUser(userId);

    await tx
      .update(memberInvitations)
      .set({
        status: "used",
        usedAt: now,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    await tx.insert(auditEvents).values({
      organizationId: row.organizationId,
      storeId: row.storeId,
      actorUserId: userId,
      action: "employee_device_pin_reset",
      metadata: { invitationId: row.id, userId },
    });
  });

  const displayName = await resolveUserDisplayName(userId);
  const trustedDevice = trustDevice ? await registerTrustedDevice({ userId }) : null;

  return {
    organizationId: row.organizationId,
    userId,
    memberId: null,
    role: row.role as "employee" | "manager",
    storeId: row.storeId,
    displayName,
    trustedDevice,
  };
}

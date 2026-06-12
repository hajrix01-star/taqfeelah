import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/core/db/client";
import { trustedDevices } from "@/core/db/schema";
import {
  generateTrustedDeviceSecret,
  hashTrustedDeviceSecret,
} from "@/features/trusted-devices/server/trusted-device-token";

export async function registerTrustedDevice(input: {
  userId: string;
  userAgent?: string;
}) {
  const db = getDb();
  const deviceId = randomUUID();
  const secret = generateTrustedDeviceSecret();
  const deviceTokenHash = hashTrustedDeviceSecret(secret);
  const now = new Date();

  await db.insert(trustedDevices).values({
    id: deviceId,
    userId: input.userId,
    deviceTokenHash,
    userAgent: input.userAgent?.slice(0, 500) || null,
    lastUsedAt: now,
    createdAt: now,
  });

  return { deviceId, secret };
}

export async function isTrustedDeviceActive(input: {
  userId: string;
  deviceId: string;
  secret: string;
}) {
  const db = getDb();
  const deviceTokenHash = hashTrustedDeviceSecret(input.secret);
  const [row] = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.id, input.deviceId),
        eq(trustedDevices.userId, input.userId),
        eq(trustedDevices.deviceTokenHash, deviceTokenHash),
        isNull(trustedDevices.revokedAt),
      ),
    )
    .limit(1);

  if (row?.id) {
    await db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(eq(trustedDevices.id, row.id));
    return true;
  }
  return false;
}

export async function revokeTrustedDevicesForUser(userId: string) {
  const db = getDb();
  const now = new Date();
  await db
    .update(trustedDevices)
    .set({ revokedAt: now })
    .where(
      and(eq(trustedDevices.userId, userId), isNull(trustedDevices.revokedAt)),
    );
}

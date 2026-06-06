import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/features/auth/server/password-hash";

const ownerPasswordSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().trim().min(1).max(120),
  password: z.string().trim().min(4).max(120),
});

const employeePinSchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().trim().min(4).max(12),
});

export async function upsertOwnerPasswordIdentity(rawInput: z.infer<typeof ownerPasswordSchema>) {
  const parsed = ownerPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner password identity input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const passwordHash = await hashPassword(input.password);
  const db = getDb();
  const username = input.username.trim().toLowerCase();

  const [existing] = await db
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, input.userId),
        eq(authIdentities.provider, "username_password"),
      ),
    )
    .limit(1);

  if (existing?.id) {
    await db
      .update(authIdentities)
      .set({
        username,
        passwordHash,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(authIdentities.id, existing.id));
    return { id: existing.id, userId: input.userId, provider: "username_password" as const };
  }

  const [created] = await db
    .insert(authIdentities)
    .values({
      userId: input.userId,
      provider: "username_password",
      username,
      passwordHash,
      status: "active",
    })
    .returning({ id: authIdentities.id });

  return { id: created.id, userId: input.userId, provider: "username_password" as const };
}

export async function upsertEmployeePinIdentity(rawInput: z.infer<typeof employeePinSchema>) {
  const parsed = employeePinSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid employee pin identity input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const passwordHash = await hashPassword(input.pin);
  const db = getDb();

  const [existing] = await db
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, input.userId),
        eq(authIdentities.provider, "employee_pin"),
      ),
    )
    .limit(1);

  if (existing?.id) {
    await db
      .update(authIdentities)
      .set({
        passwordHash,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(authIdentities.id, existing.id));
    return { id: existing.id, userId: input.userId, provider: "employee_pin" as const };
  }

  const [created] = await db
    .insert(authIdentities)
    .values({
      userId: input.userId,
      provider: "employee_pin",
      passwordHash,
      status: "active",
    })
    .returning({ id: authIdentities.id });

  return { id: created.id, userId: input.userId, provider: "employee_pin" as const };
}

export async function verifyOwnerPasswordIdentity(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password.trim()) return null;

  const db = getDb();
  const [identity] = await db
    .select({
      id: authIdentities.id,
      userId: authIdentities.userId,
      passwordHash: authIdentities.passwordHash,
      status: authIdentities.status,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.username, normalized),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  if (!identity?.passwordHash) return null;
  const valid = await verifyPassword(password, identity.passwordHash);
  if (!valid) return null;
  return { userId: identity.userId, identityId: identity.id };
}

export async function verifyEmployeePinIdentity(userId: string, pin: string) {
  if (!userId || !pin.trim()) return null;
  const db = getDb();
  const [identity] = await db
    .select({
      id: authIdentities.id,
      passwordHash: authIdentities.passwordHash,
      status: authIdentities.status,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "employee_pin"),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  if (!identity?.passwordHash) return null;
  const valid = await verifyPassword(pin, identity.passwordHash);
  if (!valid) return null;
  return { userId, identityId: identity.id };
}

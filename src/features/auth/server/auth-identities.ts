import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/features/auth/server/password-hash";
import { passwordSchema } from "@/core/auth/password-policy";

type AuthIdentityDb = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update">;

function resolveDb(executor?: AuthIdentityDb) {
  return executor ?? getDb();
}

const ownerPasswordSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().trim().min(1).max(120),
  password: passwordSchema,
  phoneNumber: z.string().trim().max(30).optional(),
  loginPhone: z.string().trim().max(30).optional(),
  mustChangePassword: z.boolean().optional(),
});

const employeePinSchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().trim().min(4).max(12),
  loginPhone: z.string().trim().max(30).optional(),
});

export async function upsertOwnerPasswordIdentity(
  rawInput: z.infer<typeof ownerPasswordSchema>,
  executor?: AuthIdentityDb,
) {
  const parsed = ownerPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner password identity input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const passwordHash = await hashPassword(input.password);
  const db = resolveDb(executor);
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

  const mustChangePassword = input.mustChangePassword ?? false;
  const phoneNumber = input.phoneNumber?.trim() || null;
  const loginPhone = input.loginPhone?.trim() || phoneNumber;

  if (existing?.id) {
    await db
      .update(authIdentities)
      .set({
        username,
        passwordHash,
        phoneNumber,
        loginPhone,
        mustChangePassword,
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
      phoneNumber,
      loginPhone,
      mustChangePassword,
      status: "active",
    })
    .returning({ id: authIdentities.id });

  return { id: created.id, userId: input.userId, provider: "username_password" as const };
}

export async function upsertEmployeePinIdentity(
  rawInput: z.infer<typeof employeePinSchema>,
  executor?: AuthIdentityDb,
) {
  const parsed = employeePinSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid employee pin identity input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const passwordHash = await hashPassword(input.pin);
  const db = resolveDb(executor);

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

  const loginPhone = input.loginPhone?.trim() || null;

  if (existing?.id) {
    await db
      .update(authIdentities)
      .set({
        passwordHash,
        loginPhone,
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
      loginPhone,
      status: "active",
    })
    .returning({ id: authIdentities.id });

  return { id: created.id, userId: input.userId, provider: "employee_pin" as const };
}

export async function updateEmployeeLoginPhone(
  userId: string,
  loginPhone: string | null,
  executor?: AuthIdentityDb,
) {
  const db = resolveDb(executor);
  const [existing] = await db
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "employee_pin"),
      ),
    )
    .limit(1);

  if (!existing?.id) {
    throw new ValidationError("Employee login identity was not found. Set a PIN first.");
  }

  await db
    .update(authIdentities)
    .set({
      loginPhone,
      updatedAt: new Date(),
    })
    .where(eq(authIdentities.id, existing.id));

  return { id: existing.id, userId, provider: "employee_pin" as const };
}

export async function getOwnerPasswordIdentityFlags(userId: string) {
  const db = getDb();
  const [identity] = await db
    .select({
      mustChangePassword: authIdentities.mustChangePassword,
      phoneNumber: authIdentities.phoneNumber,
      username: authIdentities.username,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  return identity ?? null;
}

export async function clearOwnerMustChangePassword(userId: string, executor?: AuthIdentityDb) {
  const db = resolveDb(executor);
  await db
    .update(authIdentities)
    .set({
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "username_password"),
      ),
    );
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
      mustChangePassword: authIdentities.mustChangePassword,
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
  return {
    userId: identity.userId,
    identityId: identity.id,
    mustChangePassword: identity.mustChangePassword,
  };
}

export async function verifyOwnerLoginPhoneIdentity(loginPhone: string, password: string) {
  const normalizedPhone = loginPhone.trim();
  if (!normalizedPhone || !password.trim()) return null;

  const db = getDb();
  const [identity] = await db
    .select({
      id: authIdentities.id,
      userId: authIdentities.userId,
      passwordHash: authIdentities.passwordHash,
      mustChangePassword: authIdentities.mustChangePassword,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.loginPhone, normalizedPhone),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  if (!identity?.passwordHash) return null;
  const valid = await verifyPassword(password, identity.passwordHash);
  if (!valid) return null;
  return {
    userId: identity.userId,
    identityId: identity.id,
    mustChangePassword: identity.mustChangePassword,
  };
}

export async function resolveEmployeeUserIdByLoginPhone(loginPhone: string) {
  const normalizedPhone = loginPhone.trim();
  if (!normalizedPhone) return null;

  const db = getDb();
  const [identity] = await db
    .select({ userId: authIdentities.userId })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "employee_pin"),
        eq(authIdentities.loginPhone, normalizedPhone),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  return identity?.userId ?? null;
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

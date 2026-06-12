import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { readEnv } from "@/core/config/env";
import { getDb } from "@/core/db/client";
import { authIdentities, platformAdminGrants, users } from "@/core/db/schema";
import { ConflictError, ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { upsertOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";

export type PlatformAdminSource = "database" | "env";

export type PlatformAdminRow = {
  userId: string;
  name: string;
  username: string | null;
  loginPhone: string | null;
  grantedAt: string | null;
  source: PlatformAdminSource;
  canRevoke: boolean;
};

export type PlatformAdminLookupResult = {
  userId: string;
  name: string;
  username: string | null;
  loginPhone: string | null;
  hasPasswordLogin: boolean;
  alreadyGranted: boolean;
};

function parseEnvPlatformAdminUserIds(): Set<string> {
  const rawValue = readEnv().SAAS_PLATFORM_ADMIN_USER_IDS;
  if (!rawValue?.trim()) return new Set();
  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => z.string().uuid().safeParse(value).success),
  );
}

function buildEnvPlatformAdminUserIds(): Set<string> {
  const env = readEnv();
  const allowedUserIds = parseEnvPlatformAdminUserIds();
  for (const candidate of [env.AUTH_OWNER_USER_ID, env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID]) {
    if (candidate && z.string().uuid().safeParse(candidate).success) {
      allowedUserIds.add(candidate.toLowerCase());
    }
  }
  return allowedUserIds;
}

async function loadUserAuthSummary(userIds: string[]) {
  if (!userIds.length) return new Map<string, { username: string | null; loginPhone: string | null }>();

  const db = getDb();
  const rows = await db
    .select({
      userId: authIdentities.userId,
      username: authIdentities.username,
      loginPhone: authIdentities.loginPhone,
    })
    .from(authIdentities)
    .where(
      and(
        inArray(authIdentities.userId, userIds),
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
      ),
    );

  return new Map(
    rows.map((row) => [
      row.userId,
      {
        username: row.username,
        loginPhone: row.loginPhone,
      },
    ]),
  );
}

export async function hasPlatformAdminGrant(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ userId: platformAdminGrants.userId })
    .from(platformAdminGrants)
    .where(eq(platformAdminGrants.userId, userId))
    .limit(1);
  return Boolean(row?.userId);
}

export async function listPlatformAdmins(actorUserId: string): Promise<PlatformAdminRow[]> {
  const db = getDb();
  const envUserIds = buildEnvPlatformAdminUserIds();
  const grantRows = await db
    .select({
      userId: platformAdminGrants.userId,
      grantedAt: platformAdminGrants.grantedAt,
      name: users.name,
    })
    .from(platformAdminGrants)
    .innerJoin(users, eq(platformAdminGrants.userId, users.id))
    .orderBy(asc(platformAdminGrants.grantedAt));

  const allUserIds = new Set<string>([
    ...grantRows.map((row) => row.userId),
    ...envUserIds,
  ]);
  const authSummary = await loadUserAuthSummary([...allUserIds]);

  const rowsByUserId = new Map<string, PlatformAdminRow>();

  for (const grant of grantRows) {
    const auth = authSummary.get(grant.userId);
    rowsByUserId.set(grant.userId, {
      userId: grant.userId,
      name: grant.name,
      username: auth?.username ?? null,
      loginPhone: auth?.loginPhone ?? null,
      grantedAt: grant.grantedAt.toISOString(),
      source: envUserIds.has(grant.userId.toLowerCase()) ? "env" : "database",
      canRevoke: grant.userId !== actorUserId,
    });
  }

  for (const envUserId of envUserIds) {
    if (rowsByUserId.has(envUserId)) continue;
    const [userRow] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, envUserId))
      .limit(1);
    const auth = authSummary.get(envUserId);
    rowsByUserId.set(envUserId, {
      userId: envUserId,
      name: userRow?.name ?? envUserId,
      username: auth?.username ?? null,
      loginPhone: auth?.loginPhone ?? null,
      grantedAt: null,
      source: "env",
      canRevoke: false,
    });
  }

  return [...rowsByUserId.values()].sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "env" ? -1 : 1;
    }
    return (left.grantedAt ?? "").localeCompare(right.grantedAt ?? "");
  });
}

const lookupSchema = z.object({
  username: z.string().trim().min(1).max(120).optional(),
  userId: z.string().uuid().optional(),
}).refine((value) => Boolean(value.username || value.userId), {
  message: "username or userId is required.",
});

export async function lookupPlatformAdminCandidate(
  rawInput: z.infer<typeof lookupSchema>,
): Promise<PlatformAdminLookupResult> {
  const parsed = lookupSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin lookup input.", parsed.error.flatten());
  }

  const db = getDb();
  let userId = parsed.data.userId;

  if (!userId && parsed.data.username) {
    const normalizedUsername = parsed.data.username.trim().toLowerCase();
    const [identity] = await db
      .select({
        userId: authIdentities.userId,
      })
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, "username_password"),
          eq(authIdentities.username, normalizedUsername),
        ),
      )
      .limit(1);
    if (!identity?.userId) {
      throw new ValidationError("No user found for that username.");
    }
    userId = identity.userId;
  }

  if (!userId) {
    throw new ValidationError("username or userId is required.");
  }

  const [userRow] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!userRow) {
    throw new ValidationError("User not found.");
  }

  const [identity] = await db
    .select({
      username: authIdentities.username,
      loginPhone: authIdentities.loginPhone,
      status: authIdentities.status,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "username_password"),
      ),
    )
    .limit(1);

  const envUserIds = buildEnvPlatformAdminUserIds();
  const alreadyGranted = envUserIds.has(userId.toLowerCase()) || await hasPlatformAdminGrant(userId);

  return {
    userId,
    name: userRow.name,
    username: identity?.username ?? null,
    loginPhone: identity?.loginPhone ?? null,
    hasPasswordLogin: identity?.status === "active",
    alreadyGranted,
  };
}

const grantSchema = z.object({
  userId: z.string().uuid(),
});

export async function grantPlatformAdmin(
  rawInput: z.infer<typeof grantSchema>,
  grantedByUserId: string,
): Promise<PlatformAdminRow> {
  const parsed = grantSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin grant input.", parsed.error.flatten());
  }

  const candidate = await lookupPlatformAdminCandidate({ userId: parsed.data.userId });
  if (!candidate.hasPasswordLogin) {
    throw new ValidationError("User must have an active username/password login before platform admin access.");
  }
  if (candidate.alreadyGranted) {
    throw new ConflictError("User already has platform admin access.");
  }

  const db = getDb();
  const now = new Date();
  await db
    .insert(platformAdminGrants)
    .values({
      userId: parsed.data.userId,
      grantedAt: now,
      grantedByUserId,
    })
    .onConflictDoNothing();

  const row = (await listPlatformAdmins(grantedByUserId)).find((item) => item.userId === parsed.data.userId);
  if (!row) {
    throw new Error("Failed to load platform admin after grant.");
  }
  return row;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(120),
  password: z.string().trim().min(4).max(120),
});

export async function createPlatformAdminUser(
  rawInput: z.infer<typeof createSchema>,
  grantedByUserId: string,
): Promise<PlatformAdminRow> {
  const parsed = createSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin create input.", parsed.error.flatten());
  }

  const db = getDb();
  const userId = randomUUID();
  const now = new Date();
  const username = parsed.data.username.trim().toLowerCase();

  const [existingIdentity] = await db
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.username, username),
      ),
    )
    .limit(1);
  if (existingIdentity?.id) {
    throw new ConflictError("Username is already taken.");
  }

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: parsed.data.name.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await upsertOwnerPasswordIdentity(
      {
        userId,
        username,
        password: parsed.data.password,
      },
      tx,
    );

    await tx.insert(platformAdminGrants).values({
      userId,
      grantedAt: now,
      grantedByUserId,
    });
  });

  const row = (await listPlatformAdmins(grantedByUserId)).find((item) => item.userId === userId);
  if (!row) {
    throw new Error("Failed to load platform admin after create.");
  }
  return row;
}

export async function revokePlatformAdmin(
  targetUserId: string,
  actorUserId: string,
): Promise<void> {
  if (targetUserId === actorUserId) {
    throw new ForbiddenError("You cannot revoke your own platform admin access.");
  }

  const envUserIds = buildEnvPlatformAdminUserIds();
  if (envUserIds.has(targetUserId.toLowerCase())) {
    throw new ForbiddenError("Environment-configured platform admins cannot be revoked from the console.");
  }

  const db = getDb();
  const deleted = await db
    .delete(platformAdminGrants)
    .where(eq(platformAdminGrants.userId, targetUserId))
    .returning({ userId: platformAdminGrants.userId });

  if (!deleted.length) {
    throw new ValidationError("Platform admin grant not found.");
  }
}

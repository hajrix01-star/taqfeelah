import { z } from "zod";
import { MEMBER_ROLES, type MemberRole } from "@/core/auth/roles";
import { readEnv } from "@/core/config/env";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { hasPlatformAdminGrant } from "@/features/saas-admin/server/platform-admin-grants-repository";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  role: z.enum(MEMBER_ROLES).optional(),
});

function parsePlatformAdminUserIds(rawValue: string | undefined): Set<string> {
  if (!rawValue?.trim()) return new Set();
  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => z.string().uuid().safeParse(value).success),
  );
}

function buildAllowedPlatformAdminUserIds(env: ReturnType<typeof readEnv>): Set<string> {
  const allowedUserIds = parsePlatformAdminUserIds(env.SAAS_PLATFORM_ADMIN_USER_IDS);
  for (const candidate of [
    env.AUTH_OWNER_USER_ID,
    env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID,
  ]) {
    if (candidate && z.string().uuid().safeParse(candidate).success) {
      allowedUserIds.add(candidate.toLowerCase());
    }
  }
  return allowedUserIds;
}

function isAllowedByEnv(
  actorUserId: string,
  _role: MemberRole | undefined,
  env: ReturnType<typeof readEnv>,
): boolean {
  const allowedUserIds = buildAllowedPlatformAdminUserIds(env);
  return allowedUserIds.has(actorUserId.toLowerCase());
}

export async function assertPlatformAdminAccess(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin access input.", parsed.error.flatten());
  }

  const env = readEnv();
  const actorUserId = parsed.data.actorUserId;

  if (isAllowedByEnv(actorUserId, parsed.data.role, env)) {
    return { actorUserId };
  }

  if (await hasPlatformAdminGrant(actorUserId)) {
    return { actorUserId };
  }

  if (!buildAllowedPlatformAdminUserIds(env).size) {
    throw new ForbiddenError("Platform admin access is not configured.");
  }

  throw new ForbiddenError("User is not authorized for platform admin operations.");
}

export async function isPlatformAdminUser(
  actorUserId: string | null | undefined,
  role?: MemberRole | null,
): Promise<boolean> {
  if (!actorUserId) return false;
  try {
    await assertPlatformAdminAccess({ actorUserId, role: role ?? undefined });
    return true;
  } catch {
    return false;
  }
}

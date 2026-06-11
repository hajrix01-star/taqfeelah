import { z } from "zod";
import { MEMBER_ROLES, type MemberRole } from "@/core/auth/roles";
import { readEnv } from "@/core/config/env";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";

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

export function assertPlatformAdminAccess(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin access input.", parsed.error.flatten());
  }

  const env = readEnv();
  const allowedUserIds = buildAllowedPlatformAdminUserIds(env);
  const actorUserId = parsed.data.actorUserId.toLowerCase();

  if (allowedUserIds.has(actorUserId)) {
    return { actorUserId: parsed.data.actorUserId };
  }

  // Single-tenant read-only console: authenticated org owners may access SaaS admin.
  if (parsed.data.role === "owner") {
    return { actorUserId: parsed.data.actorUserId };
  }

  if (!allowedUserIds.size) {
    throw new ForbiddenError("Platform admin access is not configured.");
  }

  throw new ForbiddenError("User is not authorized for platform admin operations.");
}

export function isPlatformAdminUser(
  actorUserId: string | null | undefined,
  role?: MemberRole | null,
): boolean {
  if (!actorUserId) return false;
  try {
    assertPlatformAdminAccess({ actorUserId, role: role ?? undefined });
    return true;
  } catch {
    return false;
  }
}

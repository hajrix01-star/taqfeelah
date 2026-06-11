import { z } from "zod";
import { readEnv } from "@/core/config/env";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
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

export function assertPlatformAdminAccess(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin access input.", parsed.error.flatten());
  }

  const env = readEnv();
  const allowedUserIds = parsePlatformAdminUserIds(env.SAAS_PLATFORM_ADMIN_USER_IDS);
  if (!allowedUserIds.size) {
    throw new ForbiddenError("Platform admin access is not configured.");
  }

  if (!allowedUserIds.has(parsed.data.actorUserId.toLowerCase())) {
    throw new ForbiddenError("User is not authorized for platform admin operations.");
  }

  return { actorUserId: parsed.data.actorUserId };
}

export function isPlatformAdminUser(actorUserId: string | null | undefined): boolean {
  if (!actorUserId) return false;
  try {
    assertPlatformAdminAccess({ actorUserId });
    return true;
  } catch {
    return false;
  }
}

import { z } from "zod";
import { readEnv } from "@/core/config/env";

function parseFirstUuid(rawValue: string | undefined): string | null {
  if (!rawValue?.trim()) return null;
  for (const part of rawValue.split(",")) {
    const candidate = part.trim();
    if (z.string().uuid().safeParse(candidate).success) {
      return candidate;
    }
  }
  return null;
}

/** Actor UUID for self-service signup audits (must exist in users table). */
export function resolveSignupSystemActorUserId(env = readEnv()): string | null {
  const explicit = env.AUTH_SIGNUP_SYSTEM_ACTOR_USER_ID?.trim();
  if (explicit && z.string().uuid().safeParse(explicit).success) {
    return explicit;
  }

  const platformAdmin = parseFirstUuid(env.SAAS_PLATFORM_ADMIN_USER_IDS);
  if (platformAdmin) return platformAdmin;

  const ownerUserId = env.AUTH_OWNER_USER_ID?.trim();
  if (ownerUserId && z.string().uuid().safeParse(ownerUserId).success) {
    return ownerUserId;
  }

  return parseFirstUuid(env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID);
}

export function requireSignupSystemActorUserId(env = readEnv()): string {
  const actorUserId = resolveSignupSystemActorUserId(env);
  if (!actorUserId) {
    throw new Error(
      "Self-service signup requires AUTH_SIGNUP_SYSTEM_ACTOR_USER_ID or SAAS_PLATFORM_ADMIN_USER_IDS.",
    );
  }
  return actorUserId;
}

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { readEnv } from "@/core/config/env";
import { getDb } from "@/core/db/client";
import { organizationMembers } from "@/core/db/schema";
import { ServiceUnavailableError, UnauthorizedError } from "@/core/errors/app-error";
import { resolveOwnerUserIdByEmail } from "@/features/auth/server/resolve-owner-by-email";
import { resolvePlatformAdminUserIdByEmail } from "@/features/auth/server/resolve-platform-admin-by-email";
import { hasPlatformAdminGrant } from "@/features/saas-admin/server/platform-admin-grants-repository";

export const PASSWORD_RESET_AUDIENCES = ["owner", "platform_admin"] as const;

export type PasswordResetAudience = (typeof PASSWORD_RESET_AUDIENCES)[number];

const audienceSchema = z.enum(PASSWORD_RESET_AUDIENCES);

export function parsePasswordResetAudience(
  value: string | null | undefined,
): PasswordResetAudience | null {
  const parsed = audienceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function resolvePasswordResetUserId(
  email: string,
  audience: PasswordResetAudience,
): Promise<string | null> {
  if (audience === "owner") {
    return resolveOwnerUserIdByEmail(email);
  }
  return resolvePlatformAdminUserIdByEmail(email);
}

export async function assertPasswordResetUserAudience(
  userId: string,
  audience: PasswordResetAudience,
): Promise<void> {
  if (audience === "platform_admin") {
    if (!(await hasPlatformAdminGrant(userId))) {
      throw new UnauthorizedError("Reset link is invalid or expired.");
    }
    return;
  }

  const db = getDb();
  const [ownerMember] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!ownerMember) {
    throw new UnauthorizedError("Reset link is invalid or expired.");
  }
}

export async function resolvePasswordResetAuditOrganizationId(
  userId: string,
  audience: PasswordResetAudience,
): Promise<string> {
  if (audience === "owner") {
    const db = getDb();
    const [ownerMember] = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.role, "owner"),
          eq(organizationMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!ownerMember?.organizationId) {
      throw new ServiceUnavailableError("Owner organization could not be resolved.");
    }

    return ownerMember.organizationId;
  }

  const env = readEnv();
  const organizationId = env.AUTH_ORGANIZATION_ID || env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID;
  if (!organizationId || !z.string().uuid().safeParse(organizationId).success) {
    throw new ServiceUnavailableError("Platform audit organization is not configured.");
  }

  return organizationId;
}

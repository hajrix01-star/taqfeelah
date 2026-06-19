import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertEmailLoginIdentifier } from "@/core/auth/email-login-identifier";
import { isAuthDbCredentialsEnabled } from "@/core/config/auth-api-mode";
import { getProductionAuthRuntimeConfig, isServerProductionMode } from "@/core/config/env";
import { getDb } from "@/core/db/client";
import { authIdentities, organizationMembers } from "@/core/db/schema";
import {
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/core/errors/app-error";
import { verifyOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";
import { hasPlatformAdminGrant } from "@/features/saas-admin/server/platform-admin-grants-repository";

const inputSchema = z.object({
  email: z.string().trim().email("A valid email address is required."),
  password: z.string().min(1, "password is required."),
});

export type PlatformAdminAuthSessionInput = z.infer<typeof inputSchema>;

export type PlatformAdminAuthSessionResult = {
  organizationId: string;
  userId: string;
  role: "owner";
  displayName: string;
  mustChangePassword: boolean;
};

async function resolvePlatformAdminOrganizationId(userId: string): Promise<string> {
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

  if (ownerMember?.organizationId) {
    return ownerMember.organizationId;
  }

  const envAuth = getProductionAuthRuntimeConfig();
  const organizationId = envAuth.organizationId;
  if (!organizationId || !z.string().uuid().safeParse(organizationId).success) {
    throw new ServiceUnavailableError("Platform admin organization is not configured.");
  }

  return organizationId;
}

async function assertStoredPlatformAdminEmail(userId: string, email: string): Promise<void> {
  const db = getDb();
  const [identity] = await db
    .select({ username: authIdentities.username })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.userId, userId),
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.status, "active"),
      ),
    )
    .limit(1);

  const storedUsername = identity?.username?.trim().toLowerCase() ?? "";
  if (!storedUsername || !storedUsername.includes("@")) {
    throw new UnauthorizedError(
      "This platform admin account must be updated to use an email login before sign-in.",
    );
  }

  if (storedUsername !== email) {
    throw new UnauthorizedError("Invalid credentials.");
  }
}

export async function createPlatformAdminAuthSession(
  rawInput: PlatformAdminAuthSessionInput,
): Promise<PlatformAdminAuthSessionResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid platform admin login payload.", parsed.error.flatten());
  }

  if (!isAuthDbCredentialsEnabled() || !isServerProductionMode()) {
    throw new ServiceUnavailableError("Platform admin email login is not available.");
  }

  const email = assertEmailLoginIdentifier(parsed.data.email);
  const password = parsed.data.password.trim();
  if (!password) {
    throw new ValidationError("password is required.");
  }

  const verified = await verifyOwnerPasswordIdentity(email, password);
  if (!verified) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  await assertStoredPlatformAdminEmail(verified.userId, email);

  if (!(await hasPlatformAdminGrant(verified.userId))) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  const organizationId = await resolvePlatformAdminOrganizationId(verified.userId);
  const displayName = await resolveUserDisplayName(verified.userId);

  return {
    organizationId,
    userId: verified.userId,
    role: "owner",
    displayName,
    mustChangePassword: verified.mustChangePassword,
  };
}

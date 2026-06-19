import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  verifyOwnerPasswordIdentity,
  hasPlatformAdminGrant,
  resolveUserDisplayName,
  getDb,
} = vi.hoisted(() => ({
  verifyOwnerPasswordIdentity: vi.fn(),
  hasPlatformAdminGrant: vi.fn(),
  resolveUserDisplayName: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("@/core/config/auth-api-mode", () => ({
  isAuthDbCredentialsEnabled: () => true,
}));

vi.mock("@/core/config/env", () => ({
  isServerProductionMode: () => true,
  getProductionAuthRuntimeConfig: () => ({
    organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
    ownerUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  }),
}));

vi.mock("@/features/auth/server/auth-identities", () => ({
  verifyOwnerPasswordIdentity,
}));

vi.mock("@/features/saas-admin/server/platform-admin-grants-repository", () => ({
  hasPlatformAdminGrant,
}));

vi.mock("@/features/auth/server/resolve-user-display-name", () => ({
  resolveUserDisplayName,
}));

vi.mock("@/core/db/client", () => ({
  getDb,
}));

import { createPlatformAdminAuthSession } from "@/features/auth/server/create-platform-admin-auth-session";

describe("createPlatformAdminAuthSession", () => {
  beforeEach(() => {
    verifyOwnerPasswordIdentity.mockReset();
    hasPlatformAdminGrant.mockReset();
    resolveUserDisplayName.mockReset();
    getDb.mockReset();
  });

  it("rejects legacy usernames even when password verification succeeds", async () => {
    verifyOwnerPasswordIdentity.mockResolvedValue({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      identityId: "identity-1",
      mustChangePassword: false,
    });
    hasPlatformAdminGrant.mockResolvedValue(true);
    getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ username: "hajri" }],
          }),
        }),
      }),
    });

    await expect(createPlatformAdminAuthSession({
      email: "hajri@taqfeelah.com",
      password: "secret",
    })).rejects.toMatchObject({
      message: expect.stringContaining("email login"),
    });
  });

  it("creates a session for email-based platform admins", async () => {
    verifyOwnerPasswordIdentity.mockResolvedValue({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      identityId: "identity-1",
      mustChangePassword: false,
    });
    hasPlatformAdminGrant.mockResolvedValue(true);
    resolveUserDisplayName.mockResolvedValue("Owner");

    let call = 0;
    getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              call += 1;
              if (call === 1) {
                return [{ username: "owner@taqfeelah.com" }];
              }
              return [{ organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1" }];
            },
          }),
        }),
      }),
    });

    const session = await createPlatformAdminAuthSession({
      email: "owner@taqfeelah.com",
      password: "secret",
    });

    expect(session.userId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(session.organizationId).toBe("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");
    expect(session.displayName).toBe("Owner");
  });
});

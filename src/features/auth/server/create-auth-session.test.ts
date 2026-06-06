import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettingsByOrganizationId: vi.fn(async () => ({ settings: {} })),
}));

vi.mock("@/features/auth/server/auth-identities", () => ({
  verifyOwnerPasswordIdentity: vi.fn(async () => ({
    userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    identityId: "identity-1",
  })),
  verifyEmployeePinIdentity: vi.fn(async () => null),
}));

const memberRow = {
  userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  role: "owner",
  status: "active",
};

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
        where: () => ({
          limit: async () => [memberRow],
        }),
      }),
    }),
  }),
}));

describe("createAuthSession", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.AUTH_ORGANIZATION_ID;
    delete process.env.AUTH_OWNER_USER_ID;
    delete process.env.AUTH_OWNER_USERNAME;
    delete process.env.AUTH_OWNER_PASSWORD;
  });

  it("uses auth_identities when AUTH_DB_CREDENTIALS_ENABLED=true", async () => {
    vi.stubEnv("AUTH_DB_CREDENTIALS_ENABLED", "true");
    vi.stubEnv("AUTH_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");
    vi.stubEnv("AUTH_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f");

    const { createAuthSession } = await import("./create-auth-session");
    const { verifyOwnerPasswordIdentity } = await import("./auth-identities");

    const session = await createAuthSession({
      mode: "owner_password",
      username: "owner",
      password: "secret",
    });

    expect(verifyOwnerPasswordIdentity).toHaveBeenCalledWith("owner", "secret");
    expect(session.userId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(session.role).toBe("owner");
  });
});

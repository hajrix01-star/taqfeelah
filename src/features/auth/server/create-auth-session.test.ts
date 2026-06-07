import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettingsByOrganizationId: vi.fn(async () => ({ settings: {} })),
}));

const verifyOwnerPasswordIdentity = vi.fn(async () => ({
  userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  identityId: "identity-1",
}));
const verifyEmployeePinIdentity = vi.fn<
  (userId: string, pin: string) => Promise<{ userId: string; identityId: string } | null>
>(async () => null);

vi.mock("@/features/auth/server/auth-identities", () => ({
  verifyOwnerPasswordIdentity,
  verifyEmployeePinIdentity,
}));

const ownerMemberRow = {
  userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  role: "owner",
  status: "active",
};

const employeeMemberRow = {
  userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  role: "employee",
  status: "active",
};

let activeMemberRow = ownerMemberRow;

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
          limit: async () => [activeMemberRow],
        }),
      }),
    }),
  }),
}));

describe("createAuthSession", () => {
  beforeEach(() => {
    activeMemberRow = ownerMemberRow;
    verifyOwnerPasswordIdentity.mockReset();
    verifyOwnerPasswordIdentity.mockResolvedValue({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      identityId: "identity-1",
    });
    verifyEmployeePinIdentity.mockReset();
    verifyEmployeePinIdentity.mockResolvedValue(null);
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

    const session = await createAuthSession({
      mode: "owner_password",
      username: "owner",
      password: "secret",
    });

    expect(verifyOwnerPasswordIdentity).toHaveBeenCalledWith("owner", "secret");
    expect(session.userId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(session.role).toBe("owner");
  });

  it("uses auth_identities for employee pin when AUTH_DB_CREDENTIALS_ENABLED=true", async () => {
    activeMemberRow = employeeMemberRow;
    verifyEmployeePinIdentity.mockResolvedValue({
      userId: employeeMemberRow.userId,
      identityId: "identity-employee",
    });

    vi.stubEnv("AUTH_DB_CREDENTIALS_ENABLED", "true");
    vi.stubEnv("AUTH_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");
    vi.stubEnv("AUTH_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f");

    const { createAuthSession } = await import("./create-auth-session");

    const session = await createAuthSession({
      mode: "employee_pin",
      employeeId: employeeMemberRow.userId,
      pin: "1234",
    });

    expect(verifyEmployeePinIdentity).toHaveBeenCalledWith(employeeMemberRow.userId, "1234");
    expect(session.userId).toBe(employeeMemberRow.userId);
    expect(session.role).toBe("employee");
  });
});

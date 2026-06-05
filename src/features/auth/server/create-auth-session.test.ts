import { describe, expect, it, vi, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) })) })),
  innerJoin: vi.fn(),
};

vi.mock("@/core/db/client", () => ({ getDb: () => mockDb }));
vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettingsByOrganizationId: vi.fn(async () => ({
    settings: {
      authConfig: {
        ownerUsername: "hajri",
        ownerPassword: "123",
        employeePins: {},
      },
      credentialVersion: 0,
    },
  })),
}));

const ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const OWNER_USER_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";

vi.mock("@/core/config/env", () => ({
  getProductionAuthRuntimeConfig: () => ({
    organizationId: ORG_ID,
    ownerUserId: OWNER_USER_ID,
    ownerUsername: "",
    ownerPassword: "",
    employeePinMap: {},
    userIdMap: { ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79" },
    storeIdMap: {},
  }),
}));

describe("createAuthSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { userId: OWNER_USER_ID, role: "owner", status: "active" },
          ]),
        }),
      }),
    });
  });

  it("rejects invalid mode", async () => {
    const { createAuthSession } = await import("@/features/auth/server/create-auth-session");
    await expect(createAuthSession({ mode: "bad_mode" as never })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects owner login with wrong credentials", async () => {
    const { createAuthSession } = await import("@/features/auth/server/create-auth-session");
    await expect(
      createAuthSession({ mode: "owner_password", username: "hajri", password: "wrong" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("succeeds owner login with correct plaintext password (legacy path)", async () => {
    const { createAuthSession } = await import("@/features/auth/server/create-auth-session");
    const result = await createAuthSession({
      mode: "owner_password",
      username: "hajri",
      password: "123",
    });
    expect(result.role).toBe("owner");
    expect(result.userId).toBe(OWNER_USER_ID);
    expect(result.organizationId).toBe(ORG_ID);
  });

  it("rejects employee login without employeeId", async () => {
    const { createAuthSession } = await import("@/features/auth/server/create-auth-session");
    await expect(
      createAuthSession({ mode: "employee_pin", pin: "1234" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects unmapped employee id", async () => {
    const { createAuthSession } = await import("@/features/auth/server/create-auth-session");
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        }),
      }),
    });
    await expect(
      createAuthSession({ mode: "employee_pin", employeeId: "nobody", pin: "1234" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

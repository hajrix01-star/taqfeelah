import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hasPlatformAdminGrant = vi.fn();

vi.mock("@/features/saas-admin/server/platform-admin-grants-repository", () => ({
  hasPlatformAdminGrant,
}));

describe("assertPlatformAdminAccess", () => {
  beforeEach(() => {
    vi.resetModules();
    hasPlatformAdminGrant.mockReset();
    hasPlatformAdminGrant.mockResolvedValue(false);
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("allows configured platform admin user ids", async () => {
    vi.stubEnv(
      "SAAS_PLATFORM_ADMIN_USER_IDS",
      "e8f3e35b-6051-4da3-8b10-979700c2f00f,11111111-1111-4111-8111-111111111111",
    );
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    const result = await assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    });
    expect(result.actorUserId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(hasPlatformAdminGrant).not.toHaveBeenCalled();
  });

  it("rejects non-owner users outside platform admin list", async () => {
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "11111111-1111-4111-8111-111111111111";
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    await expect(assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      role: "employee",
    })).rejects.toThrow("User is not authorized for platform admin operations.");
  });

  it("rejects org owners who are not on the platform admin allowlist", async () => {
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "11111111-1111-4111-8111-111111111111";
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    await expect(assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      role: "owner",
    })).rejects.toThrow("User is not authorized for platform admin operations.");
  });

  it("allows AUTH_OWNER_USER_ID when allowlist is empty", async () => {
    vi.stubEnv("AUTH_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f");
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    const result = await assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    });
    expect(result.actorUserId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
  });

  it("allows users with database platform admin grants", async () => {
    hasPlatformAdminGrant.mockResolvedValue(true);
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    const result = await assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      role: "employee",
    });
    expect(result.actorUserId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(hasPlatformAdminGrant).toHaveBeenCalledWith("e8f3e35b-6051-4da3-8b10-979700c2f00f");
  });

  it("isPlatformAdminUser returns boolean without throwing", async () => {
    vi.stubEnv(
      "SAAS_PLATFORM_ADMIN_USER_IDS",
      "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    );
    const { isPlatformAdminUser } = await import("./assert-platform-admin-access");
    await expect(isPlatformAdminUser("e8f3e35b-6051-4da3-8b10-979700c2f00f")).resolves.toBe(true);
    await expect(isPlatformAdminUser("00000000-0000-4000-8000-000000000000")).resolves.toBe(false);
    await expect(isPlatformAdminUser(null)).resolves.toBe(false);
  });
});

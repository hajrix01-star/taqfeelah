import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("assertPlatformAdminAccess", () => {
  beforeEach(() => {
    vi.resetModules();
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
    const result = assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    });
    expect(result.actorUserId).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
  });

  it("rejects users outside platform admin list", async () => {
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "11111111-1111-4111-8111-111111111111";
    const { assertPlatformAdminAccess } = await import("./assert-platform-admin-access");
    expect(() => assertPlatformAdminAccess({
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    })).toThrow("User is not authorized for platform admin operations.");
  });

  it("isPlatformAdminUser returns boolean without throwing", async () => {
    vi.stubEnv(
      "SAAS_PLATFORM_ADMIN_USER_IDS",
      "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    );
    const { isPlatformAdminUser } = await import("./assert-platform-admin-access");
    expect(isPlatformAdminUser("e8f3e35b-6051-4da3-8b10-979700c2f00f")).toBe(true);
    expect(isPlatformAdminUser("00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(isPlatformAdminUser(null)).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

describe("runtime settings production staff guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects active production staff rows without canonical user id and memberId", async () => {
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");

    const { assertProductionStaffUsesCanonicalIds } = await import("./runtime-settings-service");

    expect(() => assertProductionStaffUsesCanonicalIds([{
      id: "ahmed",
      memberId: "11111111-1111-4111-8111-111111111111",
      active: true,
    }])).toThrow("Production staff settings require canonical user id and memberId.");

    expect(() => assertProductionStaffUsesCanonicalIds([{
      id: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      active: true,
    }])).toThrow("Production staff settings require canonical user id and memberId.");
  });

  it("allows inactive legacy staff rows and active canonical rows", async () => {
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");

    const { assertProductionStaffUsesCanonicalIds } = await import("./runtime-settings-service");

    expect(() => assertProductionStaffUsesCanonicalIds([
      {
        id: "ahmed",
        active: false,
        removed: true,
      },
      {
        id: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        memberId: "11111111-1111-4111-8111-111111111111",
        active: true,
      },
    ])).not.toThrow();
  });

  it("strips operational runtime settings in production DB/API mode", async () => {
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED", "true");

    const { stripProductionOperationalRuntimeSettings } = await import("./runtime-settings-service");

    const stripped = stripProductionOperationalRuntimeSettings({
      authConfig: { employeePins: [] },
      configuredBusinesses: [{ id: "store-1" }],
      archivedBusinessIds: ["store-2"],
      staff: [{ id: "staff-1" }],
      storeChannelSettings: { "store-1": { channels: [] } },
      storeOperationalSettings: { "store-1": { dayStartsAt: "00:00" } },
      notebookTheme: "cream",
      ownerShellPreferences: { collapsed: true },
      employeePreferences: { compact: false },
    });

    expect(stripped).toEqual({
      notebookTheme: "cream",
      ownerShellPreferences: { collapsed: true },
      employeePreferences: { compact: false },
    });
  });

  it("keeps runtime settings unchanged outside production DB/API mode", async () => {
    vi.stubEnv("APP_MODE", "prototype");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    vi.stubEnv("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED", "true");

    const { stripProductionOperationalRuntimeSettings } = await import("./runtime-settings-service");

    const settings = {
      configuredBusinesses: [{ id: "store-1" }],
      staff: [{ id: "staff-1" }],
      storeChannelSettings: { "store-1": { channels: [] } },
      notebookTheme: "cream",
    };

    expect(stripProductionOperationalRuntimeSettings(settings)).toEqual(settings);
  });
});

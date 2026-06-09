import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyRuntimeSettingsSnapshotPatch,
  buildRuntimeSettingsPersistPayload,
  buildRuntimeSettingsSnapshot,
  resolveOwnerSettingsApiAuth,
  serializeRuntimeSettingsSignature,
  usesRuntimeSettingsApi,
} from "./runtime-settings-bridge";

describe("runtime settings bridge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("buildRuntimeSettingsSnapshot omits org entities when org config API is enabled", () => {
    const snapshot = buildRuntimeSettingsSnapshot({
      orgConfigApiEnabled: true,
      storeOperationalSettings: { shami: { reviewEnabled: true } },
      notebookTheme: "yellow",
      employeePreferences: { ahmed: { notebookTheme: "classic" } },
      ownerShellPreferences: { acknowledgedDuplicateSales: { shami: true } },
      ownerProfile: { nameAr: "مالك" },
      authConfig: { ownerUsername: "owner", ownerPassword: "demo", employeePins: {} },
      configuredBusinesses: [{ id: "shami" }],
      archivedBusinessIds: ["old"],
      storeChannelSettings: { shami: [] },
      staff: [{ id: "ahmed" }],
    });

    expect(snapshot).toEqual({
      storeOperationalSettings: { shami: { reviewEnabled: true } },
      notebookTheme: "yellow",
      employeePreferences: { ahmed: { notebookTheme: "classic" } },
      ownerShellPreferences: { acknowledgedDuplicateSales: { shami: true } },
      ownerProfile: { nameAr: "مالك" },
      authConfig: { ownerUsername: "owner", ownerPassword: "demo", employeePins: {} },
    });
    expect(snapshot).not.toHaveProperty("staff");
    expect(snapshot).not.toHaveProperty("configuredBusinesses");
  });

  it("buildRuntimeSettingsSnapshot includes org entities when org config API is disabled", () => {
    const businesses = [{ id: "shami" }];
    const staff = [{ id: "ahmed" }];
    const snapshot = buildRuntimeSettingsSnapshot({
      orgConfigApiEnabled: false,
      storeOperationalSettings: {},
      notebookTheme: "ivory",
      employeePreferences: { ahmed: { notebookTheme: "ivory" } },
      ownerShellPreferences: { closeoutAlerts: [] },
      ownerProfile: {},
      authConfig: { ownerUsername: "owner", ownerPassword: "demo", employeePins: {} },
      configuredBusinesses: businesses,
      archivedBusinessIds: [],
      storeChannelSettings: {},
      staff,
    });

    if (!("configuredBusinesses" in snapshot) || !("staff" in snapshot)) {
      expect.fail("expected full runtime settings snapshot");
    }
    expect(snapshot.configuredBusinesses).toBe(businesses);
    expect(snapshot.staff).toBe(staff);
  });

  it("usesRuntimeSettingsApi is true when entries API DB source is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(usesRuntimeSettingsApi()).toBe(true);
  });

  it("resolveOwnerSettingsApiAuth returns env UUID fallback when entries API is enabled without session", () => {
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "11111111-1111-4111-8111-111111111111");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", "22222222-2222-4222-8222-222222222222");

    expect(resolveOwnerSettingsApiAuth()).toEqual({
      organizationId: "11111111-1111-4111-8111-111111111111",
      actorUserId: "22222222-2222-4222-8222-222222222222",
      actorRole: "owner",
    });
  });

  it("resolveOwnerSettingsApiAuth prefers session UUIDs in production prototype-access mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");

    expect(resolveOwnerSettingsApiAuth({
      sessionOrganizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sessionUserId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      actorRole: "employee",
    })).toEqual({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      actorUserId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      actorRole: "employee",
    });
  });

  it("resolveOwnerSettingsApiAuth uses session UUIDs in production server-auth mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "false");

    expect(resolveOwnerSettingsApiAuth({
      sessionOrganizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sessionUserId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    })).toEqual({
      organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      actorUserId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      actorRole: "owner",
    });
  });

  it("applyRuntimeSettingsSnapshotPatch applies only shared fields when org config API is enabled", () => {
    const apply = {
      setConfiguredBusinesses: vi.fn(),
      setStoreOperationalSettings: vi.fn(),
      setNotebookTheme: vi.fn(),
      setEmployeePreferences: vi.fn(),
      setOwnerShellPreferences: vi.fn(),
      setAuthOwnerUsername: vi.fn(),
    };

    applyRuntimeSettingsSnapshotPatch({
      orgConfigApiEnabled: true,
      migrated: {
        configuredBusinesses: [{ id: "shami" }],
        storeOperationalSettings: { shami: { reviewEnabled: true } },
        notebookTheme: "yellow",
        employeePreferences: { ahmed: { notebookTheme: "classic" } },
        ownerShellPreferences: { closeoutAlerts: [] },
        authConfig: { ownerUsername: "  hajri  " },
      },
      apply,
    });

    expect(apply.setConfiguredBusinesses).not.toHaveBeenCalled();
    expect(apply.setStoreOperationalSettings).toHaveBeenCalledWith({ shami: { reviewEnabled: true } });
    expect(apply.setNotebookTheme).toHaveBeenCalledWith("yellow");
    expect(apply.setEmployeePreferences).toHaveBeenCalledWith({ ahmed: { notebookTheme: "classic" } });
    expect(apply.setOwnerShellPreferences).toHaveBeenCalledWith({ closeoutAlerts: [] });
    expect(apply.setAuthOwnerUsername).toHaveBeenCalledWith("hajri");
  });

  it("buildRuntimeSettingsPersistPayload merges partial auth config", () => {
    const snapshot = {
      notebookTheme: "yellow",
      authConfig: {
        ownerUsername: "owner",
        ownerPassword: "old",
        employeePins: { ahmed: "1111" },
      },
    };

    const payload = buildRuntimeSettingsPersistPayload(snapshot, {
      authConfig: {
        ownerPassword: "new",
        employeePins: { sara: "2222" },
      },
    });

    expect(payload.authConfig).toEqual({
      ownerUsername: "owner",
      ownerPassword: "new",
      employeePins: { sara: "2222" },
    });
    expect(payload.notebookTheme).toBe("yellow");
  });

  it("serializeRuntimeSettingsSignature returns empty string for circular values", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(serializeRuntimeSettingsSignature(circular)).toBe("");
  });

  it("applyRuntimeSettingsSnapshotPatch ignores invalid notebook themes", () => {
    const apply = { setNotebookTheme: vi.fn() };

    applyRuntimeSettingsSnapshotPatch({
      orgConfigApiEnabled: true,
      migrated: { notebookTheme: "not-a-theme" },
      apply,
    });

    expect(apply.setNotebookTheme).not.toHaveBeenCalled();
  });
});

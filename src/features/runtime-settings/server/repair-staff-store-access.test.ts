import { describe, expect, it, vi, beforeEach } from "vitest";

const provisionCalls: unknown[] = [];

vi.mock("@/core/config/org-config-api-mode", () => ({
  isOrgConfigApiEnabled: vi.fn(() => false),
}));

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettingsByOrganizationId: vi.fn(async () => ({
    settings: {
      configuredBusinesses: [{ id: "custom-1780679701214" }],
      staff: [
        {
          id: "staff-1",
          active: true,
          apiUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
          storeIds: ["custom-1780679701214"],
        },
      ],
    },
    schemaVersion: 1,
  })),
}));

vi.mock("@/features/runtime-settings/server/provision-staff-members", () => ({
  provisionStaffMembers: vi.fn(async (...args: unknown[]) => {
    provisionCalls.push(args);
    return args[1];
  }),
}));

vi.mock("@/core/config/env", () => ({
  getProductionAuthRuntimeConfig: () => ({
    storeIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
    userIdMap: {},
  }),
}));

vi.mock("@/features/runtime-settings/server/enrich-runtime-store-id-map", () => ({
  enrichRuntimeStoreIdMap: vi.fn(async (_orgId, storeIdMap) => ({
    ...storeIdMap,
    "custom-1780679701214": "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  })),
}));

describe("repairStaffStoreAccess", () => {
  beforeEach(() => {
    provisionCalls.length = 0;
  });

  it("skips legacy provisioning when org-config API is enabled", async () => {
    const { isOrgConfigApiEnabled } = await import("@/core/config/org-config-api-mode");
    vi.mocked(isOrgConfigApiEnabled).mockReturnValueOnce(true);

    const { repairStaffStoreAccess } = await import("./repair-staff-store-access");
    const result = await repairStaffStoreAccess("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");

    expect(result).toEqual({ staffCount: 0, activeStaffCount: 0, skipped: true });
    expect(provisionCalls).toHaveLength(0);
  });

  it("re-provisions staff with merged custom store map", async () => {
    const { isOrgConfigApiEnabled } = await import("@/core/config/org-config-api-mode");
    vi.mocked(isOrgConfigApiEnabled).mockReturnValue(false);

    const { repairStaffStoreAccess } = await import("./repair-staff-store-access");

    const result = await repairStaffStoreAccess("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");

    expect(result.activeStaffCount).toBe(1);
    expect(provisionCalls).toHaveLength(1);
    const firstCall = provisionCalls[0] as [string, unknown, { storeIdMap: Record<string, string> }] | undefined;
    const options = firstCall?.[2];
    expect(options?.storeIdMap["custom-1780679701214"]).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });
});

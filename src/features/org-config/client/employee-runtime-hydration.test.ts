import { afterEach, describe, expect, it, vi } from "vitest";

const fetchEmployeeRuntimeBundleViaApi = vi.fn();

vi.mock("./org-config-api-client.js", () => ({
  fetchEmployeeRuntimeBundleViaApi,
}));

afterEach(() => {
  fetchEmployeeRuntimeBundleViaApi.mockReset();
  vi.unstubAllEnvs();
});

describe("loadEmployeeRuntimeContextFromApi", () => {
  it("loads stores and channels without calling members API", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "11111111-1111-4111-8111-111111111111");
    fetchEmployeeRuntimeBundleViaApi.mockResolvedValueOnce({
      stores: [{
        id: "22222222-2222-4222-8222-222222222222",
        name: "Store A",
        status: "active",
        location: "",
      }],
      channelsByStoreId: {
        "22222222-2222-4222-8222-222222222222": [{
          id: "33333333-3333-4333-8333-333333333333",
          name: "cash",
          status: "active",
        }],
      },
    });

    const { loadEmployeeRuntimeContextFromApi } = await import("./employee-runtime-hydration.js");
    const mapped = await loadEmployeeRuntimeContextFromApi({
      sessionUserId: "44444444-4444-4444-8444-444444444444",
      sessionOrganizationId: "55555555-5555-4555-8555-555555555555",
    });

    expect(fetchEmployeeRuntimeBundleViaApi).toHaveBeenCalledWith({
      organizationId: "55555555-5555-4555-8555-555555555555",
      actorUserId: "44444444-4444-4444-8444-444444444444",
      actorRole: "employee",
    });
    expect(mapped?.configuredBusinesses).toHaveLength(1);
    expect(mapped?.configuredBusinesses?.[0]?.id).toBe("22222222-2222-4222-8222-222222222222");
    expect("staff" in (mapped || {})).toBe(false);
  });

  it("returns null when session user id is missing", async () => {
    const { loadEmployeeRuntimeContextFromApi } = await import("./employee-runtime-hydration.js");
    await expect(loadEmployeeRuntimeContextFromApi({ sessionUserId: "" })).resolves.toBeNull();
    expect(fetchEmployeeRuntimeBundleViaApi).not.toHaveBeenCalled();
  });
});

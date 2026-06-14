import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const getOrganizationStoresChannelsBundle = vi.fn();

vi.mock("@/features/org-config/server/get-organization-stores-channels-bundle", () => ({
  getOrganizationStoresChannelsBundle,
}));

describe("org config stores-channels bundle route", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getOrganizationStoresChannelsBundle.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns stores and channels bundle", async () => {
    getOrganizationStoresChannelsBundle.mockResolvedValueOnce({
      stores: [{ id: "22222222-2222-4222-8222-222222222222", name: "Store A" }],
      channelsByStoreId: {
        "22222222-2222-4222-8222-222222222222": [{ id: "55555555-5555-4555-8555-555555555555", name: "Cash" }],
      },
    });

    const { GET } = await import("../org-config/stores-channels-bundle/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/org-config/stores-channels-bundle?storeStatus=all&channelStatus=all"),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ stores: Array<{ name: string }>; channelsByStoreId: Record<string, unknown[]> }>(response);
    expect(body.stores[0]?.name).toBe("Store A");
    expect(body.channelsByStoreId["22222222-2222-4222-8222-222222222222"]).toHaveLength(1);
    expect(getOrganizationStoresChannelsBundle).toHaveBeenCalledWith(expect.objectContaining({
      storeStatus: "all",
      channelStatus: "all",
      actorRole: "owner",
    }));
  });
});

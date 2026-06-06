import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const updateOrganizationStore = vi.fn();

vi.mock("@/features/org-config/server/update-organization-store", () => ({
  updateOrganizationStore,
}));

describe("store patch route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    updateOrganizationStore.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("PATCH updates store name", async () => {
    updateOrganizationStore.mockResolvedValueOnce({
      id: TEST_STORE_ID,
      name: "Updated Store",
      status: "active",
    });

    const { PATCH } = await import("../stores/[storeId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Store" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ name: string }>(response);
    expect(body.name).toBe("Updated Store");
    expect(updateOrganizationStore).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      name: "Updated Store",
      actorRole: "owner",
    }));
  });

  it("PATCH archives a store when status is archived", async () => {
    updateOrganizationStore.mockResolvedValueOnce({
      id: TEST_STORE_ID,
      name: "Shami",
      status: "archived",
    });

    const { PATCH } = await import("../stores/[storeId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived", reason: "seasonal_close" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    expect(updateOrganizationStore).toHaveBeenCalledWith(expect.objectContaining({
      status: "archived",
      reason: "seasonal_close",
    }));
  });
});

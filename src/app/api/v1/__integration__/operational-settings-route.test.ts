import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getStoreOperationalSettings = vi.fn();
const updateStoreOperationalSettings = vi.fn();

vi.mock("@/features/org-config/server/update-store-operational-settings", () => ({
  getStoreOperationalSettings,
  updateStoreOperationalSettings,
}));

describe("operational settings route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStoreOperationalSettings.mockReset();
    updateStoreOperationalSettings.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns store operational settings payload", async () => {
    getStoreOperationalSettings.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      operationalSettings: {
        activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
        employeeHistoryVisibility: "all",
        closeoutAlert: true,
        notebookTheme: null,
      },
    });

    const { GET } = await import("../stores/[storeId]/operational-settings/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/operational-settings`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ operationalSettings: { closeoutAlert: boolean } }>(response);
    expect(body.operationalSettings.closeoutAlert).toBe(true);
    expect(getStoreOperationalSettings).toHaveBeenCalledOnce();
  });

  it("PATCH rejects invalid operational settings patch", async () => {
    const { PATCH } = await import("../stores/[storeId]/operational-settings/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/operational-settings`, {
        method: "PATCH",
        body: JSON.stringify({ employeeHistoryVisibility: "invalid" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(updateStoreOperationalSettings).not.toHaveBeenCalled();
  });

  it("PATCH persists valid operational settings patch", async () => {
    updateStoreOperationalSettings.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      operationalSettings: { closeoutAlert: true },
      updatedAt: "2026-06-05T10:00:00.000Z",
    });

    const { PATCH } = await import("../stores/[storeId]/operational-settings/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/operational-settings`, {
        method: "PATCH",
        body: JSON.stringify({ closeoutAlert: true }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    expect(updateStoreOperationalSettings).toHaveBeenCalledWith(expect.objectContaining({
      patch: { closeoutAlert: true },
      actorRole: "owner",
    }));
  });
});

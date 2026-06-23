import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const updateOrganizationStore = vi.fn();
const deleteOrganizationStore = vi.fn();

vi.mock("@/features/org-config/server/update-organization-store", () => ({
  updateOrganizationStore,
}));

vi.mock("@/features/org-config/server/delete-organization-store", () => ({
  deleteOrganizationStore,
}));

describe("store route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    updateOrganizationStore.mockReset();
    deleteOrganizationStore.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("DELETE removes a store", async () => {
    deleteOrganizationStore.mockResolvedValueOnce({
      id: TEST_STORE_ID,
      deleted: true,
    });

    const { DELETE } = await import("../stores/[storeId]/route");
    const response = await DELETE(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: "owner_deleted_store" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ deleted: boolean }>(response);
    expect(body.deleted).toBe(true);
    expect(deleteOrganizationStore).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      reason: "owner_deleted_store",
    }));
  });

  it("DELETE surfaces validation errors", async () => {
    deleteOrganizationStore.mockRejectedValueOnce(new ValidationError("Store has operational records and cannot be deleted."));

    const { DELETE } = await import("../stores/[storeId]/route");
    const response = await DELETE(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}`, {
        method: "DELETE",
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(deleteOrganizationStore).toHaveBeenCalledOnce();
  });
});

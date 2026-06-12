import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_OWNER_USER_ID,
} from "./helpers";

const createSaasAccountStore = vi.fn();
const updateSaasAccountStore = vi.fn();

vi.mock("@/features/saas-admin/server/create-saas-account-store", () => ({
  createSaasAccountStore,
}));

vi.mock("@/features/saas-admin/server/update-saas-account-store", () => ({
  updateSaasAccountStore,
}));

describe("saas admin store routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = TEST_OWNER_USER_ID;
    __resetEnvCacheForTests();
    createSaasAccountStore.mockReset();
    updateSaasAccountStore.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("POST /saas-admin/accounts/:id/stores creates a store", async () => {
    createSaasAccountStore.mockResolvedValueOnce({
      id: "store-2",
      name: "Branch 2",
      location: "Riyadh",
      status: "active",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });

    const { POST } = await import("../saas-admin/accounts/[id]/stores/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores", {
        method: "POST",
        body: JSON.stringify({
          name: "Branch 2",
          location: "Riyadh",
        }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(201);
    expect(createSaasAccountStore).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: TEST_OWNER_USER_ID,
      organizationId: "org-1",
      name: "Branch 2",
      location: "Riyadh",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/stores/:storeId updates a store", async () => {
    updateSaasAccountStore.mockResolvedValueOnce({
      id: "store-2",
      name: "Branch 2 Updated",
      location: "Jeddah",
      status: "active",
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T01:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/stores/[storeId]/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-2", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Branch 2 Updated",
          location: "Jeddah",
        }),
      }),
      { params: Promise.resolve({ id: "org-1", storeId: "store-2" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSaasAccountStore).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      storeId: "store-2",
      name: "Branch 2 Updated",
      location: "Jeddah",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/stores/:storeId surfaces store not found", async () => {
    updateSaasAccountStore.mockRejectedValueOnce(catalogAppError(ERROR_CODES.STORE_NOT_FOUND));

    const { PATCH } = await import("../saas-admin/accounts/[id]/stores/[storeId]/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-9", {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      }),
      { params: Promise.resolve({ id: "org-1", storeId: "store-9" }) },
    );

    expect(response.status).toBe(404);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("STORE_NOT_FOUND");
  });
});

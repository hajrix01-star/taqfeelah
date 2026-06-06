import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
  TEST_OWNER_USER_ID,
  TEST_STORE_ID,
} from "./helpers";

const listOrganizationStores = vi.fn();
const createOrganizationStore = vi.fn();

vi.mock("@/features/org-config/server/list-organization-stores", () => ({
  listOrganizationStores,
}));

vi.mock("@/features/org-config/server/create-organization-store", () => ({
  createOrganizationStore,
}));

describe("stores route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listOrganizationStores.mockReset();
    createOrganizationStore.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns organization stores", async () => {
    listOrganizationStores.mockResolvedValueOnce({
      stores: [{ id: TEST_STORE_ID, name: "Shami", status: "active" }],
    });

    const { GET } = await import("../stores/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/stores?status=active"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ stores: Array<{ id: string }> }>(response);
    expect(body.stores).toHaveLength(1);
    expect(listOrganizationStores).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_OWNER_USER_ID,
      actorRole: "owner",
      status: "active",
    }));
  });

  it("GET rejects invalid status query", async () => {
    const { GET } = await import("../stores/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/stores?status=deleted"));

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(listOrganizationStores).not.toHaveBeenCalled();
  });

  it("POST creates a store", async () => {
    createOrganizationStore.mockResolvedValueOnce({
      id: TEST_STORE_ID,
      name: "New Store",
      location: "Riyadh",
      status: "active",
    });

    const { POST } = await import("../stores/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/stores", {
        method: "POST",
        body: JSON.stringify({ name: "New Store", location: "Riyadh" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createOrganizationStore).toHaveBeenCalledWith(expect.objectContaining({
      name: "New Store",
      location: "Riyadh",
      actorRole: "owner",
    }));
  });

  it("POST surfaces server validation errors", async () => {
    createOrganizationStore.mockRejectedValueOnce(new ValidationError("Invalid store create input."));

    const { POST } = await import("../stores/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/stores", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(createOrganizationStore).toHaveBeenCalledOnce();
  });
});

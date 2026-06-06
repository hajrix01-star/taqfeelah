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

const listStoreOutflowCategories = vi.fn();

vi.mock("@/features/org-config/server/list-store-outflow-categories", () => ({
  listStoreOutflowCategories,
}));

const TEST_OUTFLOW_CATEGORY_ID = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

describe("outflow categories route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listStoreOutflowCategories.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns store outflow categories", async () => {
    listStoreOutflowCategories.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      categories: [{ id: TEST_OUTFLOW_CATEGORY_ID, name: "Rent", status: "active" }],
    });

    const { GET } = await import("../stores/[storeId]/outflow-categories/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/outflow-categories?status=active`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ categories: Array<{ id: string }> }>(response);
    expect(body.categories).toHaveLength(1);
    expect(listStoreOutflowCategories).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      status: "active",
      actorRole: "owner",
    }));
  });

  it("GET rejects invalid status query", async () => {
    const { GET } = await import("../stores/[storeId]/outflow-categories/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/outflow-categories?status=deleted`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(listStoreOutflowCategories).not.toHaveBeenCalled();
  });

  it("GET surfaces server validation errors", async () => {
    listStoreOutflowCategories.mockRejectedValueOnce(new ValidationError("Invalid outflow categories list input."));

    const { GET } = await import("../stores/[storeId]/outflow-categories/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/outflow-categories`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(listStoreOutflowCategories).toHaveBeenCalledOnce();
  });
});

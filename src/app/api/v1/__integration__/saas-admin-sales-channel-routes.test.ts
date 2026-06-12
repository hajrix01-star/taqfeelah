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

const listSaasAccountStoreSalesChannels = vi.fn();
const createSaasAccountStoreSalesChannel = vi.fn();
const updateSaasAccountStoreSalesChannel = vi.fn();

vi.mock("@/features/saas-admin/server/list-saas-account-store-sales-channels", () => ({
  listSaasAccountStoreSalesChannels,
}));

vi.mock("@/features/saas-admin/server/create-saas-account-store-sales-channel", () => ({
  createSaasAccountStoreSalesChannel,
}));

vi.mock("@/features/saas-admin/server/update-saas-account-store-sales-channel", () => ({
  updateSaasAccountStoreSalesChannel,
}));

describe("saas admin sales channel routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = TEST_OWNER_USER_ID;
    __resetEnvCacheForTests();
    listSaasAccountStoreSalesChannels.mockReset();
    createSaasAccountStoreSalesChannel.mockReset();
    updateSaasAccountStoreSalesChannel.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("GET /saas-admin/accounts/:id/stores/:storeId/sales-channels lists channels", async () => {
    listSaasAccountStoreSalesChannels.mockResolvedValueOnce({
      storeId: "store-1",
      channels: [
        {
          id: "channel-1",
          name: "Delivery",
          status: "active",
          retiredAt: null,
          createdAt: "2026-06-11T00:00:00.000Z",
        },
      ],
    });

    const { GET } = await import("../saas-admin/accounts/[id]/stores/[storeId]/sales-channels/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-1/sales-channels?status=active"),
      { params: Promise.resolve({ id: "org-1", storeId: "store-1" }) },
    );

    expect(response.status).toBe(200);
    expect(listSaasAccountStoreSalesChannels).toHaveBeenCalledWith({
      organizationId: "org-1",
      storeId: "store-1",
      status: "active",
    });
  });

  it("POST /saas-admin/accounts/:id/stores/:storeId/sales-channels creates a channel", async () => {
    createSaasAccountStoreSalesChannel.mockResolvedValueOnce({
      id: "channel-2",
      name: "Talabat",
      status: "active",
      retiredAt: null,
      createdAt: "2026-06-11T00:00:00.000Z",
    });

    const { POST } = await import("../saas-admin/accounts/[id]/stores/[storeId]/sales-channels/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-1/sales-channels", {
        method: "POST",
        body: JSON.stringify({
          name: "Talabat",
          reason: "platform_support_channel_add",
        }),
      }),
      { params: Promise.resolve({ id: "org-1", storeId: "store-1" }) },
    );

    expect(response.status).toBe(201);
    expect(createSaasAccountStoreSalesChannel).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: TEST_OWNER_USER_ID,
      organizationId: "org-1",
      storeId: "store-1",
      name: "Talabat",
      status: "active",
      reason: "platform_support_channel_add",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/stores/:storeId/sales-channels updates channel status", async () => {
    updateSaasAccountStoreSalesChannel.mockResolvedValueOnce({
      id: "channel-2",
      name: "Talabat",
      status: "retired",
      retiredAt: "2026-06-11T01:00:00.000Z",
      createdAt: "2026-06-11T00:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/stores/[storeId]/sales-channels/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-1/sales-channels", {
        method: "PATCH",
        body: JSON.stringify({
          salesChannelId: "channel-2",
          status: "retired",
          reason: "platform_support_channel_retire",
        }),
      }),
      { params: Promise.resolve({ id: "org-1", storeId: "store-1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSaasAccountStoreSalesChannel).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      storeId: "store-1",
      salesChannelId: "channel-2",
      status: "retired",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/stores/:storeId/sales-channels surfaces store not found", async () => {
    updateSaasAccountStoreSalesChannel.mockRejectedValueOnce(catalogAppError(ERROR_CODES.STORE_NOT_FOUND));

    const { PATCH } = await import("../saas-admin/accounts/[id]/stores/[storeId]/sales-channels/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/stores/store-9/sales-channels", {
        method: "PATCH",
        body: JSON.stringify({
          salesChannelId: "channel-2",
          status: "retired",
        }),
      }),
      { params: Promise.resolve({ id: "org-1", storeId: "store-9" }) },
    );

    expect(response.status).toBe(404);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("STORE_NOT_FOUND");
  });
});

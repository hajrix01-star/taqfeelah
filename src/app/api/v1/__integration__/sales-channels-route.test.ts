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

const listStoreSalesChannels = vi.fn();
const createStoreSalesChannel = vi.fn();
const updateStoreSalesChannel = vi.fn();

vi.mock("@/features/org-config/server/list-store-sales-channels", () => ({
  listStoreSalesChannels,
}));

vi.mock("@/features/org-config/server/create-store-sales-channel", () => ({
  createStoreSalesChannel,
}));

vi.mock("@/features/org-config/server/update-store-sales-channel", () => ({
  updateStoreSalesChannel,
}));

const TEST_SALES_CHANNEL_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

describe("sales channels route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listStoreSalesChannels.mockReset();
    createStoreSalesChannel.mockReset();
    updateStoreSalesChannel.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns store sales channels", async () => {
    listStoreSalesChannels.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      channels: [{ id: TEST_SALES_CHANNEL_ID, name: "Cash", status: "active" }],
    });

    const { GET } = await import("../stores/[storeId]/sales-channels/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels?status=active`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ channels: Array<{ id: string }> }>(response);
    expect(body.channels).toHaveLength(1);
    expect(listStoreSalesChannels).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      status: "active",
      actorRole: "owner",
    }));
  });

  it("GET rejects invalid status query", async () => {
    const { GET } = await import("../stores/[storeId]/sales-channels/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels?status=deleted`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(listStoreSalesChannels).not.toHaveBeenCalled();
  });

  it("POST creates a sales channel", async () => {
    createStoreSalesChannel.mockResolvedValueOnce({
      id: TEST_SALES_CHANNEL_ID,
      name: "Delivery",
      status: "active",
      retiredAt: null,
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const { POST } = await import("../stores/[storeId]/sales-channels/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "POST",
        body: JSON.stringify({
          name: "Delivery",
          status: "active",
          reason: "owner_added_channel",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ channel: { id: string; name: string } }>(response);
    expect(body.channel.name).toBe("Delivery");
    expect(createStoreSalesChannel).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      name: "Delivery",
      kind: "payment_method",
      status: "active",
      reason: "owner_added_channel",
      actorRole: "owner",
    }));
  });

  it("POST accepts sales channel kind", async () => {
    createStoreSalesChannel.mockResolvedValueOnce({
      id: TEST_SALES_CHANNEL_ID,
      name: "Jahez",
      kind: "sales_channel",
      status: "active",
      retiredAt: null,
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const { POST } = await import("../stores/[storeId]/sales-channels/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "POST",
        body: JSON.stringify({
          name: "Jahez",
          kind: "sales_channel",
          status: "active",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    expect(createStoreSalesChannel).toHaveBeenCalledWith(expect.objectContaining({
      kind: "sales_channel",
    }));
  });

  it("POST requires a channel name", async () => {
    const { POST } = await import("../stores/[storeId]/sales-channels/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "POST",
        body: JSON.stringify({ status: "active" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(createStoreSalesChannel).not.toHaveBeenCalled();
  });

  it("PATCH updates sales channel status", async () => {
    updateStoreSalesChannel.mockResolvedValueOnce({
      id: TEST_SALES_CHANNEL_ID,
      status: "retired",
    });

    const { PATCH } = await import("../stores/[storeId]/sales-channels/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "PATCH",
        body: JSON.stringify({
          salesChannelId: TEST_SALES_CHANNEL_ID,
          status: "retired",
          reason: "unused channel",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    expect(updateStoreSalesChannel).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      salesChannelId: TEST_SALES_CHANNEL_ID,
      status: "retired",
      reason: "unused channel",
      actorRole: "owner",
    }));
  });

  it("PATCH requires active or retired status", async () => {
    const { PATCH } = await import("../stores/[storeId]/sales-channels/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "PATCH",
        body: JSON.stringify({
          salesChannelId: TEST_SALES_CHANNEL_ID,
          status: "deleted",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(updateStoreSalesChannel).not.toHaveBeenCalled();
  });

  it("PATCH surfaces server validation errors", async () => {
    updateStoreSalesChannel.mockRejectedValueOnce(new ValidationError("Invalid sales channel update input."));

    const { PATCH } = await import("../stores/[storeId]/sales-channels/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/sales-channels`, {
        method: "PATCH",
        body: JSON.stringify({
          salesChannelId: TEST_SALES_CHANNEL_ID,
          status: "active",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(updateStoreSalesChannel).toHaveBeenCalledOnce();
  });
});

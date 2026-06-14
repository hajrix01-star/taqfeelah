import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const listStoreCloseouts = vi.fn();
const submitStoreCloseout = vi.fn();

vi.mock("@/features/closeouts/server/list-store-closeouts", () => ({
  listStoreCloseouts,
}));

vi.mock("@/features/closeouts/server/submit-store-closeout", () => ({
  submitStoreCloseout,
}));

describe("closeouts route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listStoreCloseouts.mockReset();
    submitStoreCloseout.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET lists closeouts for store", async () => {
    listStoreCloseouts.mockResolvedValueOnce({
      items: [{ id: "closeout-1", date: "2026-06-05", status: "reviewed" }],
      nextCursor: null,
    });

    const { GET } = await import("../stores/[storeId]/closeouts/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<Array<{ id: string }>>(response);
    expect(body).toHaveLength(1);
    expect(listStoreCloseouts).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      actorRole: "owner",
      paginated: false,
    }));
  });

  it("GET returns paginated closeouts payload when paginated=1", async () => {
    listStoreCloseouts.mockResolvedValueOnce({
      items: [{ id: "closeout-1", date: "2026-06-05", status: "reviewed" }],
      nextCursor: "cursor-1",
    });

    const { GET } = await import("../stores/[storeId]/closeouts/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts?paginated=1&limit=25`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ items: Array<{ id: string }>; nextCursor: string }>(response);
    expect(body.items).toHaveLength(1);
    expect(body.nextCursor).toBe("cursor-1");
    expect(listStoreCloseouts).toHaveBeenCalledWith(expect.objectContaining({
      paginated: true,
      limit: 25,
    }));
  });

  it("POST requires date in body", async () => {
    const { POST } = await import("../stores/[storeId]/closeouts/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts`, {
        method: "POST",
        body: JSON.stringify({ salesChannels: [], outflows: [] }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(submitStoreCloseout).not.toHaveBeenCalled();
  });

  it("POST submits closeout and auto-approves on server", async () => {
    submitStoreCloseout.mockResolvedValueOnce({
      summaryEntryId: "entry-1",
      closeoutId: "closeout-1",
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/closeouts/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          salesChannels: [{ channelId: "cash", amount: 100 }],
          outflows: [],
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    expect(submitStoreCloseout).toHaveBeenCalledWith(expect.objectContaining({
      date: "2026-06-05",
      actorRole: "owner",
      mode: "submit",
    }));
  });

  it("POST generates a server closeout id when body omits closeoutId", async () => {
    submitStoreCloseout.mockResolvedValueOnce({
      summaryEntryId: "entry-2",
      closeoutId: "generated-closeout",
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/closeouts/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-06",
          salesChannels: [],
          outflows: [],
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    const submittedCloseoutId = submitStoreCloseout.mock.calls[0]?.[0]?.closeoutId;
    expect(typeof submittedCloseoutId).toBe("string");
    expect(submittedCloseoutId).not.toBe(`closeout-${TEST_STORE_ID}-2026-06-06`);
    expect(submittedCloseoutId.length).toBeGreaterThan(10);
  });
});

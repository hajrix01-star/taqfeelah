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
      storeId: TEST_STORE_ID,
      closeouts: [{ id: "closeout-1", date: "2026-06-05", status: "active" }],
    });

    const { GET } = await import("../stores/[storeId]/closeouts/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ closeouts: Array<{ id: string }> }>(response);
    expect(body.closeouts).toHaveLength(1);
    expect(listStoreCloseouts).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      actorRole: "owner",
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

  it("POST submits closeout with autoReview flag", async () => {
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
          autoReview: true,
          requireReview: false,
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    expect(submitStoreCloseout).toHaveBeenCalledWith(expect.objectContaining({
      date: "2026-06-05",
      autoReview: true,
      requireReview: false,
      actorRole: "owner",
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

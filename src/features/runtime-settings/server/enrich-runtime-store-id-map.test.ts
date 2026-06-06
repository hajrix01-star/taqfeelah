import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => [{ id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" }],
      }),
    }),
  }),
}));

describe("enrichRuntimeStoreIdMap", () => {
  it("maps single custom store id to sole active DB store when env map is empty", async () => {
    const { enrichRuntimeStoreIdMap } = await import("./enrich-runtime-store-id-map");

    const result = await enrichRuntimeStoreIdMap(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      {},
      [{ id: "custom-1780679701214" }],
    );

    expect(result["custom-1780679701214"]).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });
});

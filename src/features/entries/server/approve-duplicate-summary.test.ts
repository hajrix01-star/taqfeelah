import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const createdEntry = {
  id: "33333333-3333-4333-8333-333333333333",
  date: "2026-06-05",
  createdAt: new Date("2026-06-05T12:00:00.000Z"),
  type: "summary",
  amountHalalas: 100000,
  categoryId: null,
  note: "",
  status: "active",
  salesChannels: [],
};

vi.mock("@/features/entries/server/create-store-entry", () => ({
  createStoreEntry: vi.fn(async () => createdEntry),
}));

const auditValues = vi.fn(async () => undefined);
const existingRows = [{ id: "11111111-1111-4111-8111-111111111111" }];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => existingRows,
      }),
    }),
    insert: () => ({
      values: auditValues,
    }),
  }),
}));

describe("approveDuplicateSummary", () => {
  it("creates summary and writes duplicate_approved audit", async () => {
    const { approveDuplicateSummary } = await import("./approve-duplicate-summary");
    const { createStoreEntry } = await import("./create-store-entry");

    const result = await approveDuplicateSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      date: "2026-06-05",
      payload: {
        type: "summary",
        salesChannels: [{
          salesChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
          channelName: "Cash",
          amountHalalas: 100000,
        }],
      },
    });

    expect(result.id).toBe(createdEntry.id);
    expect(createStoreEntry).toHaveBeenCalledTimes(1);
    expect(auditValues).toHaveBeenCalledWith(expect.objectContaining({
      action: "duplicate_approved",
      metadata: expect.objectContaining({
        previousEntryIds: ["11111111-1111-4111-8111-111111111111"],
      }),
    }));
  });
});

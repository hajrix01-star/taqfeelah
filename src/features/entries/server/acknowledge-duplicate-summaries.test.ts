import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const auditValues = vi.fn(async () => undefined);
const entryIds = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => entryIds.map((id) => ({ id })),
      }),
    }),
    insert: () => ({
      values: auditValues,
    }),
  }),
}));

describe("acknowledgeDuplicateSummaries", () => {
  it("writes duplicate_approved audit for each entry", async () => {
    const { acknowledgeDuplicateSummaries } = await import("./acknowledge-duplicate-summaries");

    const result = await acknowledgeDuplicateSummaries({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      date: "2026-06-05",
      entryIds,
    });

    expect(result.acknowledgedEntryIds).toEqual(entryIds);
    expect(auditValues).toHaveBeenCalledWith([
      expect.objectContaining({
        action: "duplicate_approved",
        metadata: expect.objectContaining({ mode: "acknowledge_existing" }),
      }),
      expect.objectContaining({
        action: "duplicate_approved",
        metadata: expect.objectContaining({ mode: "acknowledge_existing" }),
      }),
    ]);
  });
});

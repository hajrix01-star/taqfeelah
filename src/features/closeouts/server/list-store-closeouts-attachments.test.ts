import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const ACTOR_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const CLOSEOUT_ID = "11111111-1111-4111-8111-111111111111";
const SUMMARY_ENTRY_ID = "entry-summary-active";
const ATTACHMENT_ID = "22222222-2222-4222-8222-222222222222";
let selectCall = 0;

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

function createQueryChain(call: number) {
  const run = () => {
    if (call === 0) return Promise.resolve([{ name: "Test Store" }]);
    if (call === 1) {
      return Promise.resolve([{
        id: CLOSEOUT_ID,
        clientCloseoutId: "closeout-a",
        date: "2026-06-07",
        daySequence: 1,
        status: "approved",
        submittedByUserId: ACTOR_ID,
        reviewedByUserId: ACTOR_ID,
        reviewedAt: new Date("2026-06-07T10:00:00.000Z"),
        returnReason: null,
        note: null,
        createdAt: new Date("2026-06-07T10:00:00.000Z"),
      }]);
    }
    if (call === 2) return Promise.resolve([]);
    if (call === 3) {
      return Promise.resolve([{
        id: SUMMARY_ENTRY_ID,
        closeoutId: CLOSEOUT_ID,
        type: "summary",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 120000,
      }]);
    }
    if (call === 4) return Promise.resolve([]);
    if (call === 5) {
      return Promise.resolve([{
        id: ATTACHMENT_ID,
        entryId: SUMMARY_ENTRY_ID,
        originalFileName: "proof.png",
        mimeType: "image/png",
        sizeBytes: 95,
        createdAt: new Date("2026-06-07T10:00:00.000Z"),
      }]);
    }
    if (call === 6) return Promise.resolve([{ id: ACTOR_ID, name: "Actor" }]);
    return Promise.resolve([]);
  };

  const chain = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => run(),
    then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      run().then(resolve, reject),
  };
  return chain;
}

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => {
      const call = selectCall;
      selectCall += 1;
      return {
        from: () => createQueryChain(call),
      };
    },
  }),
}));

describe("listStoreCloseouts attachments", () => {
  beforeEach(() => {
    selectCall = 0;
    vi.resetModules();
  });

  it("returns persisted summary-entry attachments after refresh", async () => {
    const { listStoreCloseouts } = await import("./list-store-closeouts");
    const { items: closeouts } = await listStoreCloseouts({
      organizationId: ORG_ID,
      storeId: STORE_ID,
      actorUserId: ACTOR_ID,
      actorRole: "owner",
    });

    expect(closeouts).toHaveLength(1);
    expect(closeouts[0]?.attachments).toEqual([{
      id: ATTACHMENT_ID,
      mimeType: "image/png",
      sizeBytes: 95,
      name: "proof.png",
    }]);
    expect(closeouts[0]?.totals.totalSales).toBe(1200);
  });
});

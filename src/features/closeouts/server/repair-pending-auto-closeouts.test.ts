import { describe, expect, it, vi, beforeEach } from "vitest";

const submitRow = {
  id: "audit-submit-1",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  actorUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  createdAt: new Date("2026-06-06T10:08:22.277Z"),
  metadata: {
    closeoutId: "dc-1780740496170",
    date: "2026-06-06",
    summaryEntryId: "entry-summary-1",
    outflowEntryIds: [],
  },
};

let approvalExists = false;
const updateCalls: unknown[] = [];
const insertCalls: unknown[] = [];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [submitRow],
          limit: async () => (approvalExists ? [{ id: "audit-approved" }] : []),
        }),
      }),
    }),
    transaction: async (callback: (tx: {
      update: (table: unknown) => { set: (values: unknown) => { where: () => Promise<void> } };
      insert: (table: unknown) => { values: (values: unknown) => Promise<void> };
    }) => Promise<void>) => {
      await callback({
        update: () => ({
          set: (values: unknown) => ({
            where: async () => {
              updateCalls.push(values);
            },
          }),
        }),
        insert: () => ({
          values: async (values: unknown) => {
            insertCalls.push(values);
          },
        }),
      });
    },
  }),
}));

describe("repairPendingAutoCloseouts", () => {
  beforeEach(() => {
    approvalExists = false;
    updateCalls.length = 0;
    insertCalls.length = 0;
  });

  it("activates voided entries and inserts approval for stuck submit", async () => {
    const { repairPendingAutoCloseouts } = await import("./repair-pending-auto-closeouts");

    const result = await repairPendingAutoCloseouts("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");

    expect(result.repaired).toBe(1);
    expect(updateCalls[0]).toMatchObject({ status: "active" });
    expect(insertCalls[0]).toMatchObject({
      action: "closeout_approved",
      metadata: expect.objectContaining({
        closeoutId: "dc-1780740496170",
        repaired: true,
      }),
    });
  });

  it("skips closeouts already approved after submit", async () => {
    approvalExists = true;
    const { repairPendingAutoCloseouts } = await import("./repair-pending-auto-closeouts");

    const result = await repairPendingAutoCloseouts("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");

    expect(result.repaired).toBe(0);
    expect(updateCalls).toHaveLength(0);
    expect(insertCalls).toHaveLength(0);
  });
});

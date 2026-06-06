import { describe, expect, it, vi } from "vitest";
import { auditEvents, entries } from "@/core/db/schema";

type InsertCall = { table: unknown; values: unknown };

const insertCalls: InsertCall[] = [];

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    transaction: async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) =>
      callback(createTx()),
  }),
}));

function createTx() {
  return {
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        insertCalls.push({ table, values });
        const rows = Array.isArray(values) ? values : [values];
        return {
          returning: async () =>
            rows.map((row, index) => ({
              id: `entry-${insertCalls.length}-${index}`,
              type: (row as { type?: string }).type,
              amountHalalas: (row as { amountHalalas?: number }).amountHalalas,
            })),
        };
      },
    }),
  };
}

const baseInput = {
  organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  date: "2026-06-05",
  actorUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  actorRole: "employee" as const,
  closeoutId: "closeout-employee-1",
  salesChannels: [
    {
      salesChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
      channelName: "Cash",
      amountHalalas: 120000,
    },
  ],
  outflows: [],
  mode: "submit" as const,
};

function entryInserts() {
  return insertCalls.filter((call) => call.table === entries);
}

function auditInserts() {
  return insertCalls.filter((call) => call.table === auditEvents);
}

describe("submitStoreCloseout", () => {
  it("auto-approves employee closeout when autoReview is true", async () => {
    insertCalls.length = 0;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    const result = await submitStoreCloseout({
      ...baseInput,
      autoReview: true,
    });

    expect(result.summaryEntryId).toBeTruthy();

    const summaryInsert = entryInserts()[0];
    expect(summaryInsert).toBeDefined();
    expect((summaryInsert?.values as { status: string }).status).toBe("active");
    expect((summaryInsert?.values as { reviewedAt: Date | null }).reviewedAt).toBeInstanceOf(Date);

    const audits = auditInserts();
    expect(audits).toHaveLength(2);
    expect((audits[0]?.values as { action: string }).action).toBe("closeout_submitted");
    expect((audits[1]?.values as { action: string }).action).toBe("closeout_approved");
  });

  it("leaves employee closeout pending when review is explicitly required", async () => {
    insertCalls.length = 0;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: false,
      requireReview: true,
    });

    const summaryInsert = entryInserts()[0];
    expect((summaryInsert?.values as { status: string }).status).toBe("voided");
    expect((summaryInsert?.values as { reviewedAt: Date | null }).reviewedAt).toBeNull();

    const audits = auditInserts();
    expect(audits).toHaveLength(1);
    expect((audits[0]?.values as { action: string }).action).toBe("closeout_submitted");
  });

  it("persists outflows in audit metadata and inserts outflow entries", async () => {
    insertCalls.length = 0;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: false,
      outflows: [
        {
          type: "purchases",
          amountHalalas: 4500,
          categoryName: "",
          typeLabel: "مشتريات",
          note: "خضار",
        },
      ],
    });

    const entryWrites = entryInserts();
    expect(entryWrites.length).toBeGreaterThanOrEqual(2);

    const submitAudit = auditInserts().find(
      (call) => (call.values as { action?: string }).action === "closeout_submitted",
    );
    const metadata = (submitAudit?.values as { metadata?: { outflows?: unknown[]; outflowEntryIds?: string[] } }).metadata;
    expect(metadata?.outflows).toHaveLength(1);
    expect(metadata?.outflows?.[0]).toMatchObject({
      type: "purchases",
      amountHalalas: 4500,
      typeLabel: "مشتريات",
      note: "خضار",
    });
    expect(metadata?.outflowEntryIds?.length).toBe(1);
  });

  it("auto-approves employee closeout by default when requireReview is omitted", async () => {
    insertCalls.length = 0;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: false,
    });

    const summaryInsert = entryInserts()[0];
    expect((summaryInsert?.values as { status: string }).status).toBe("active");

    const audits = auditInserts();
    expect(audits).toHaveLength(2);
    expect((audits[1]?.values as { action: string }).action).toBe("closeout_approved");
  });
});

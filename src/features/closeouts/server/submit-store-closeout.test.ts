import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditEvents, dailyCloseouts, entries, entrySalesChannels } from "@/core/db/schema";

type InsertCall = { table: unknown; values: unknown };
type UpdateCall = { table: unknown; set: unknown };
type DeleteCall = { table: unknown };

const insertCalls: InsertCall[] = [];
const updateCalls: UpdateCall[] = [];
const deleteCalls: DeleteCall[] = [];
let txExistingCloseout = false;

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/features/closeouts/server/resolve-closeout-day-sequence", () => ({
  resolveCloseoutDaySequence: vi.fn(async () => 1),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => [{
          id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
          name: "Cash",
        }],
      }),
    }),
    transaction: async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) =>
      callback(createTx({ existingCloseout: txExistingCloseout })),
  }),
}));

function createTx({ existingCloseout = false } = {}) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (existingCloseout ? [{ id: "daily-closeout-1" }] : []),
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => {
        updateCalls.push({ table, set: values });
        return {
          where: async () => undefined,
        };
      },
    }),
    delete: (table: unknown) => {
      deleteCalls.push({ table });
      return {
        where: async () => undefined,
      };
    },
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        insertCalls.push({ table, values });
        const rows = Array.isArray(values) ? values : [values];
        return {
          returning: async () =>
            rows.map((row, index) => ({
              id: table === dailyCloseouts
                ? "daily-closeout-1"
                : `entry-${insertCalls.length}-${index}`,
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
  attachments: [],
  mode: "submit" as const,
};

function entryInserts() {
  return insertCalls.filter((call) => call.table === entries);
}

function closeoutInserts() {
  return insertCalls.filter((call) => call.table === dailyCloseouts);
}

function auditInserts() {
  return insertCalls.filter((call) => call.table === auditEvents);
}

describe("submitStoreCloseout", () => {
  beforeEach(() => {
    txExistingCloseout = false;
    insertCalls.length = 0;
    updateCalls.length = 0;
    deleteCalls.length = 0;
  });

  it("approves employee closeout immediately on submit", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    const result = await submitStoreCloseout(baseInput);

    expect(result.summaryEntryId).toBeTruthy();
    expect(result.dailyCloseoutId).toBe("daily-closeout-1");

    const closeoutInsert = closeoutInserts()[0];
    expect((closeoutInsert?.values as { status: string }).status).toBe("approved");

    const summaryInsert = entryInserts()[0];
    expect((summaryInsert?.values as { status: string }).status).toBe("active");
    expect((summaryInsert?.values as { closeoutId: string }).closeoutId).toBe("daily-closeout-1");

    const audits = auditInserts();
    expect(audits).toHaveLength(1);
    expect((audits[0]?.values as { action: string }).action).toBe("closeout_submitted");
  });

  it("allows owner outflow-only closeout without sales", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    const result = await submitStoreCloseout({
      ...baseInput,
      actorRole: "owner",
      salesChannels: [],
      outflows: [
        {
          type: "expense",
          amountHalalas: 8000,
          categoryName: "صيانة",
          typeLabel: "مصروف",
          note: "خارج فقط",
        },
      ],
    });

    expect(result.summaryEntryId).toBeTruthy();
    expect(result.outflowEntryIds?.length).toBe(1);
    expect(insertCalls.some((call) => call.table === entrySalesChannels)).toBe(false);
  });

  it("persists outflow entries linked to the closeout row", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
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

    const entryValues = entryInserts().flatMap((call) => (
      Array.isArray(call.values) ? call.values : [call.values]
    ));
    expect(entryValues.length).toBeGreaterThanOrEqual(2);
    entryValues.forEach((values) => {
      expect((values as { closeoutId: string }).closeoutId).toBe("daily-closeout-1");
    });

    const submitAudit = auditInserts().find(
      (call) => (call.values as { action?: string }).action === "closeout_submitted",
    );
    const metadata = (submitAudit?.values as {
      metadata?: { outflowEntryIds?: string[]; daySequence?: number; dailyCloseoutId?: string };
    }).metadata;
    expect(metadata?.outflowEntryIds?.length).toBe(1);
    expect(metadata?.daySequence).toBe(1);
    expect(metadata?.dailyCloseoutId).toBe("daily-closeout-1");
  });

  it("replaces prior entries when owner edits a closeout", async () => {
    txExistingCloseout = true;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      actorRole: "owner",
      mode: "ownerEdit",
      outflows: [
        {
          type: "expense",
          amountHalalas: 2500,
          categoryName: "كهرباء",
          typeLabel: "مصروف",
          note: "",
        },
      ],
    });

    expect(deleteCalls.some((call) => call.table === entries)).toBe(true);
    expect(updateCalls.some((call) => call.table === dailyCloseouts)).toBe(true);
    expect((auditInserts()[0]?.values as { action: string }).action).toBe("closeout_resubmitted");
  });

  it("accepts legacy resubmit mode alias for owner edit", async () => {
    txExistingCloseout = true;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      actorRole: "owner",
      mode: "resubmit",
      outflows: [],
    });

    expect((auditInserts()[0]?.values as { action: string }).action).toBe("closeout_resubmitted");
  });

  it("rejects future closeout dates", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await expect(
      submitStoreCloseout({
        ...baseInput,
        date: "2099-12-31",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("accepts one calendar day ahead of UTC for east-of-UTC clients", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    const utcToday = new Date().toISOString().slice(0, 10);
    const [y, m, d] = utcToday.split("-").map(Number);
    const tomorrowUtc = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);

    const result = await submitStoreCloseout({
      ...baseInput,
      date: tomorrowUtc,
    });

    expect(result.summaryEntryId).toBeTruthy();
  });

  it("rejects oversized outflow arrays", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await expect(
      submitStoreCloseout({
        ...baseInput,
        outflows: Array.from({ length: 101 }, (_, index) => ({
          type: "expense" as const,
          amountHalalas: 100 + index,
        })),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

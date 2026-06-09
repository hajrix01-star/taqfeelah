import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditEvents, dailyCloseouts, entries } from "@/core/db/schema";

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

const readStoreOperationalSettingsRecord = vi.fn(async () => ({
  activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
  reviewEnabled: false,
  closeoutReviewEnabled: false,
  employeeHistoryVisibility: "all" as const,
  closeoutAlert: false,
  attachmentAlert: false,
  notebookTheme: null,
}));

vi.mock("@/features/org-config/server/read-store-operational-settings", () => ({
  readStoreOperationalSettingsRecord,
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

  it("auto-approves employee closeout when autoReview is true", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    const result = await submitStoreCloseout({
      ...baseInput,
      autoReview: true,
    });

    expect(result.summaryEntryId).toBeTruthy();
    expect(result.dailyCloseoutId).toBe("daily-closeout-1");

    const closeoutInsert = closeoutInserts()[0];
    expect((closeoutInsert?.values as { status: string }).status).toBe("approved");

    const summaryInsert = entryInserts()[0];
    expect((summaryInsert?.values as { status: string }).status).toBe("active");
    expect((summaryInsert?.values as { closeoutId: string }).closeoutId).toBe("daily-closeout-1");

    const audits = auditInserts();
    expect(audits).toHaveLength(2);
    expect((audits[0]?.values as { action: string }).action).toBe("closeout_submitted");
    expect((audits[1]?.values as { action: string }).action).toBe("closeout_approved");
  });

  it("leaves employee closeout pending when persisted store settings require review", async () => {
    insertCalls.length = 0;
    readStoreOperationalSettingsRecord.mockResolvedValueOnce({
      activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
      reviewEnabled: false,
      closeoutReviewEnabled: true,
      employeeHistoryVisibility: "all",
      closeoutAlert: false,
      attachmentAlert: false,
      notebookTheme: null,
    });
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: true,
      requireReview: false,
    });

    expect((closeoutInserts()[0]?.values as { status: string }).status).toBe("submitted");
    expect((entryInserts()[0]?.values as { status: string }).status).toBe("voided");
    expect(auditInserts()).toHaveLength(1);
  });

  it("persists outflow entries linked to the closeout row", async () => {
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

  it("enforces employee review from persisted store settings even when client omits requireReview", async () => {
    insertCalls.length = 0;
    readStoreOperationalSettingsRecord.mockResolvedValueOnce({
      activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
      reviewEnabled: false,
      closeoutReviewEnabled: true,
      employeeHistoryVisibility: "all",
      closeoutAlert: false,
      attachmentAlert: false,
      notebookTheme: null,
    });
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: true,
      requireReview: false,
    });

    expect((entryInserts()[0]?.values as { status: string }).status).toBe("voided");
    expect(auditInserts()).toHaveLength(1);
  });

  it("auto-approves employee closeout by default when requireReview is omitted", async () => {
    insertCalls.length = 0;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      autoReview: false,
    });

    expect((entryInserts()[0]?.values as { status: string }).status).toBe("active");
    expect(auditInserts()).toHaveLength(2);
  });

  it("replaces prior entries when resubmitting a closeout", async () => {
    txExistingCloseout = true;
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      mode: "resubmit",
      autoReview: false,
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
    expect(closeoutInserts()).toHaveLength(0);
    expect(entryInserts().length).toBeGreaterThanOrEqual(2);
  });
});

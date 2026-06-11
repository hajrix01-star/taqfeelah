import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const ACTOR_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const DATE = "2026-06-07";
const CHANNEL_ID = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

type CloseoutRow = {
  id: string;
  clientCloseoutId: string;
  date: string;
  daySequence: number;
  status: string;
  submittedByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  returnReason: string | null;
  note: string | null;
  createdAt: Date;
};

type EntryRow = {
  id: string;
  closeoutId: string;
  type: string;
  status: string;
  categoryId: string | null;
  note: string | null;
  amountHalalas: number;
};

type SalesChannelRow = {
  entryId: string;
  salesChannelId: string;
  channelNameSnapshot: string;
  amountHalalas: number;
};

let closeoutRows: CloseoutRow[] = [];
let entryRows: EntryRow[] = [];
let salesChannelRows: SalesChannelRow[] = [];
let daySummaryMovementRows: Array<{ type: string; amountHalalas: number }> = [];
let selectCall = 0;

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/core/config/entries-api-mode", () => ({
  isEntriesApiDbSourceMode: vi.fn(() => false),
}));

function resolveSelectResult(call: number) {
  if (call === 0) return [{ name: "Test Store" }];
  if (call === 1) return closeoutRows;
  if (call === 2) return [];
  if (call === 3) return entryRows.filter((row) => row.status === "active");
  if (call === 4) return salesChannelRows;
  if (call === 5) return [];
  if (call === 6) return [{ id: ACTOR_ID, name: "Actor" }];
  if (call === 7) return daySummaryMovementRows;
  return [];
}

function createQueryChain(call: number) {
  const run = () => Promise.resolve(resolveSelectResult(call));
  const chain = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => run(),
    then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      run().then(resolve, reject),
    leftJoin: () => ({
      where: async () => [{ attachmentCount: 0 }],
    }),
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
        leftJoin: () => ({
          where: async () => [{ attachmentCount: 0 }],
        }),
      };
    },
  }),
}));

function buildCloseoutRow({
  id,
  clientCloseoutId,
  daySequence,
}: {
  id: string;
  clientCloseoutId: string;
  daySequence: number;
}): CloseoutRow {
  return {
    id,
    clientCloseoutId,
    date: DATE,
    daySequence,
    status: "approved",
    submittedByUserId: ACTOR_ID,
    reviewedByUserId: ACTOR_ID,
    reviewedAt: new Date("2026-06-07T10:00:00.000Z"),
    returnReason: null,
    note: null,
    createdAt: new Date("2026-06-07T10:00:00.000Z"),
  };
}

function sumCloseoutListTotals(
  closeouts: Array<{ totals: { totalSales: number; totalOutflow: number; netMovement: number } }>,
) {
  return closeouts.reduce(
    (acc, closeout) => ({
      totalSales: acc.totalSales + closeout.totals.totalSales,
      totalOutflow: acc.totalOutflow + closeout.totals.totalOutflow,
      netMovement: acc.netMovement + closeout.totals.netMovement,
    }),
    { totalSales: 0, totalOutflow: 0, netMovement: 0 },
  );
}

async function loadListAndDaySummary() {
  const { listStoreCloseouts } = await import("./list-store-closeouts");
  const closeouts = await listStoreCloseouts({
    organizationId: ORG_ID,
    storeId: STORE_ID,
    actorUserId: ACTOR_ID,
    actorRole: "owner",
    dateFrom: DATE,
    dateTo: DATE,
  });

  const { getStoreDaySummary } = await import("@/features/reports/server/get-store-day-summary");
  const daySummary = await getStoreDaySummary({
    organizationId: ORG_ID,
    storeId: STORE_ID,
    date: DATE,
    actorUserId: ACTOR_ID,
    actorRole: "owner",
  });

  return { closeouts, daySummary };
}

describe("closeout list totals vs day report", () => {
  beforeEach(() => {
    selectCall = 0;
    closeoutRows = [];
    entryRows = [];
    salesChannelRows = [];
    daySummaryMovementRows = [];
    vi.resetModules();
  });

  it("excludes voided entries from closeout totals and matches day report for the same day", async () => {
    const closeoutId = "11111111-1111-4111-8111-111111111111";
    closeoutRows = [
      buildCloseoutRow({
        id: closeoutId,
        clientCloseoutId: "closeout-a",
        daySequence: 1,
      }),
    ];

    entryRows = [
      {
        id: "entry-summary-voided",
        closeoutId,
        type: "summary",
        status: "voided",
        categoryId: null,
        note: null,
        amountHalalas: 50000,
      },
      {
        id: "entry-summary-active",
        closeoutId,
        type: "summary",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 120000,
      },
      {
        id: "entry-outflow-voided",
        closeoutId,
        type: "expense",
        status: "voided",
        categoryId: null,
        note: "old",
        amountHalalas: 40000,
      },
      {
        id: "entry-outflow-active",
        closeoutId,
        type: "expense",
        status: "active",
        categoryId: null,
        note: "current",
        amountHalalas: 25000,
      },
    ];

    salesChannelRows = [
      {
        entryId: "entry-summary-active",
        salesChannelId: CHANNEL_ID,
        channelNameSnapshot: "Cash",
        amountHalalas: 120000,
      },
    ];

    daySummaryMovementRows = [
      { type: "summary", amountHalalas: 120000 },
      { type: "expense", amountHalalas: 25000 },
    ];

    const { closeouts, daySummary } = await loadListAndDaySummary();

    expect(closeouts).toHaveLength(1);
    expect(closeouts[0]?.totals.totalSales).toBe(1200);
    expect(closeouts[0]?.totals.totalOutflow).toBe(250);
    expect(closeouts[0]?.totals.netMovement).toBe(950);
    expect(closeouts[0]?.outflows).toHaveLength(1);
    expect(closeouts[0]?.outflows[0]?.amount).toBe(250);

    const listTotals = sumCloseoutListTotals(closeouts);
    expect(daySummary.totalSales.amountHalalas).toBe(120000);
    expect(daySummary.totalOutflow.amountHalalas).toBe(25000);
    expect(daySummary.netMovement.amountHalalas).toBe(95000);
    expect(listTotals.totalSales * 100).toBe(daySummary.totalSales.amountHalalas);
    expect(listTotals.totalOutflow * 100).toBe(daySummary.totalOutflow.amountHalalas);
    expect(listTotals.netMovement * 100).toBe(daySummary.netMovement.amountHalalas);
  });

  it("keeps A/B same-day closeouts aligned with the day report totals", async () => {
    const closeoutA = "11111111-1111-4111-8111-111111111111";
    const closeoutB = "22222222-2222-4222-8222-222222222222";

    closeoutRows = [
      buildCloseoutRow({ id: closeoutA, clientCloseoutId: "closeout-a", daySequence: 1 }),
      buildCloseoutRow({ id: closeoutB, clientCloseoutId: "closeout-b", daySequence: 2 }),
    ];

    entryRows = [
      {
        id: "a-summary",
        closeoutId: closeoutA,
        type: "summary",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 80000,
      },
      {
        id: "a-expense",
        closeoutId: closeoutA,
        type: "expense",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 10000,
      },
      {
        id: "b-summary",
        closeoutId: closeoutB,
        type: "summary",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 50000,
      },
      {
        id: "b-voided-summary",
        closeoutId: closeoutB,
        type: "summary",
        status: "voided",
        categoryId: null,
        note: null,
        amountHalalas: 99999,
      },
      {
        id: "b-purchase",
        closeoutId: closeoutB,
        type: "purchases",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 15000,
      },
    ];

    salesChannelRows = [
      {
        entryId: "a-summary",
        salesChannelId: CHANNEL_ID,
        channelNameSnapshot: "Cash",
        amountHalalas: 80000,
      },
      {
        entryId: "b-summary",
        salesChannelId: CHANNEL_ID,
        channelNameSnapshot: "Cash",
        amountHalalas: 50000,
      },
    ];

    daySummaryMovementRows = [
      { type: "summary", amountHalalas: 80000 },
      { type: "summary", amountHalalas: 50000 },
      { type: "expense", amountHalalas: 10000 },
      { type: "purchases", amountHalalas: 15000 },
    ];

    const { closeouts, daySummary } = await loadListAndDaySummary();

    expect(closeouts).toHaveLength(2);
    expect(closeouts.map((row) => row.daySequence).sort()).toEqual([1, 2]);

    const listTotals = sumCloseoutListTotals(closeouts);
    expect(daySummary.totalSales.amountHalalas).toBe(130000);
    expect(daySummary.totalOutflow.amountHalalas).toBe(25000);
    expect(listTotals.totalSales * 100).toBe(daySummary.totalSales.amountHalalas);
    expect(listTotals.totalOutflow * 100).toBe(daySummary.totalOutflow.amountHalalas);
    expect(listTotals.netMovement * 100).toBe(daySummary.netMovement.amountHalalas);
  });

  it("matches submit closeout totals with list and day report active entries", async () => {
    const closeoutId = "11111111-1111-4111-8111-111111111111";
    closeoutRows = [
      buildCloseoutRow({
        id: closeoutId,
        clientCloseoutId: "closeout-submit-1",
        daySequence: 1,
      }),
    ];
    entryRows = [
      {
        id: "summary-active",
        closeoutId,
        type: "summary",
        status: "active",
        categoryId: null,
        note: null,
        amountHalalas: 120000,
      },
      {
        id: "expense-active",
        closeoutId,
        type: "expense",
        status: "active",
        categoryId: null,
        note: "",
        amountHalalas: 25000,
      },
    ];
    salesChannelRows = [{
      entryId: "summary-active",
      salesChannelId: CHANNEL_ID,
      channelNameSnapshot: "Cash",
      amountHalalas: 120000,
    }];
    daySummaryMovementRows = [
      { type: "summary", amountHalalas: 120000 },
      { type: "expense", amountHalalas: 25000 },
    ];

    const { closeouts, daySummary } = await loadListAndDaySummary();
    const listTotals = sumCloseoutListTotals(closeouts);

    expect(listTotals.totalSales * 100).toBe(120000);
    expect(listTotals.totalOutflow * 100).toBe(25000);
    expect(daySummary.totalSales.amountHalalas).toBe(120000);
    expect(daySummary.totalOutflow.amountHalalas).toBe(25000);
    expect(listTotals.totalSales * 100).toBe(daySummary.totalSales.amountHalalas);
    expect(listTotals.totalOutflow * 100).toBe(daySummary.totalOutflow.amountHalalas);
  });
});

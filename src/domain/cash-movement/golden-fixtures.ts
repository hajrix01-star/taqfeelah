import type { MovementRow } from "@/domain/cash-movement/types";

export type GoldenUiEntry = {
  type: string;
  amount: number;
  status?: string;
  businessId?: string;
  attachment?: unknown;
  reviewed?: boolean;
};

export type GoldenAccountingCase = {
  id: string;
  rows: MovementRow[];
  uiEntries: GoldenUiEntry[];
  closeoutSales: Array<{ channelId: string; name: string; amount: number }>;
  closeoutOutflows: Array<{ id: string; amount: number }>;
  combineParts?: Array<{ sales: number; expense: number; net: number }>;
  expected: {
    salesRiyals: number;
    expenseRiyals: number;
    netRiyals: number;
    ratio: string;
  };
};

export const GOLDEN_ACCOUNTING_CASES: GoldenAccountingCase[] = [
  {
    id: "normal-day",
    rows: [
      { type: "summary", amountHalalas: 10000 },
      { type: "expense", amountHalalas: 2000 },
    ],
    uiEntries: [
      { type: "summary", amount: 100, status: "active" },
      { type: "expense", amount: 20, status: "active" },
    ],
    closeoutSales: [{ channelId: "cash", name: "Cash", amount: 100 }],
    closeoutOutflows: [{ id: "out-1", amount: 20 }],
    expected: {
      salesRiyals: 100,
      expenseRiyals: 20,
      netRiyals: 80,
      ratio: "20.0%",
    },
  },
  {
    id: "multi-channel-sales",
    rows: [
      { type: "summary", amountHalalas: 12500 },
      { type: "summary", amountHalalas: 4500 },
      { type: "expense", amountHalalas: 2000 },
      { type: "withdrawal", amountHalalas: 1000 },
    ],
    uiEntries: [
      { type: "summary", amount: 125, status: "active" },
      { type: "summary", amount: 45, status: "active" },
      { type: "expense", amount: 20, status: "active" },
      { type: "withdrawal", amount: 10, status: "active" },
    ],
    closeoutSales: [
      { channelId: "cash", name: "Cash", amount: 125 },
      { channelId: "mada", name: "Mada", amount: 45 },
    ],
    closeoutOutflows: [{ id: "out-1", amount: 20 }, { id: "out-2", amount: 10 }],
    expected: {
      salesRiyals: 170,
      expenseRiyals: 30,
      netRiyals: 140,
      ratio: "17.6%",
    },
  },
  {
    id: "outflow-only-not-calculable",
    rows: [{ type: "expense", amountHalalas: 1500 }],
    uiEntries: [{ type: "expense", amount: 15, status: "active" }],
    closeoutSales: [],
    closeoutOutflows: [{ id: "out-1", amount: 15 }],
    expected: {
      salesRiyals: 0,
      expenseRiyals: 15,
      netRiyals: -15,
      ratio: "—",
    },
  },
  {
    id: "voided-excluded",
    rows: [
      { type: "summary", amountHalalas: 5000 },
      { type: "expense", amountHalalas: 1000 },
    ],
    uiEntries: [
      { type: "summary", amount: 100, status: "voided" },
      { type: "summary", amount: 50, status: "active" },
      { type: "expense", amount: 30, status: "voided" },
      { type: "expense", amount: 10, status: "active" },
    ],
    closeoutSales: [{ channelId: "cash", name: "Cash", amount: 50 }],
    closeoutOutflows: [{ id: "out-1", amount: 10 }],
    expected: {
      salesRiyals: 50,
      expenseRiyals: 10,
      netRiyals: 40,
      ratio: "20.0%",
    },
  },
  {
    id: "zero-day",
    rows: [],
    uiEntries: [],
    closeoutSales: [],
    closeoutOutflows: [],
    expected: {
      salesRiyals: 0,
      expenseRiyals: 0,
      netRiyals: 0,
      ratio: "0.0%",
    },
  },
  {
    id: "combine-two-stores",
    rows: [
      { type: "summary", amountHalalas: 150000 },
      { type: "expense", amountHalalas: 30000 },
    ],
    uiEntries: [
      { type: "summary", amount: 1000, status: "active" },
      { type: "summary", amount: 500, status: "active" },
      { type: "expense", amount: 200, status: "active" },
      { type: "expense", amount: 100, status: "active" },
    ],
    closeoutSales: [
      { channelId: "cash", name: "Cash", amount: 1000 },
      { channelId: "mada", name: "Mada", amount: 500 },
    ],
    closeoutOutflows: [{ id: "out-1", amount: 200 }, { id: "out-2", amount: 100 }],
    combineParts: [
      { sales: 1000, expense: 200, net: 800 },
      { sales: 500, expense: 100, net: 400 },
    ],
    expected: {
      salesRiyals: 1500,
      expenseRiyals: 300,
      netRiyals: 1200,
      ratio: "20.0%",
    },
  },
];

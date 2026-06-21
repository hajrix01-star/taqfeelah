import { describe, expect, it } from "vitest";
import {
  resolveOperationalEntrySalesAmount,
  signedOperationalEntryAmount,
  sumOperationalSummaryEntryAmounts,
} from "./resolve-operational-entry-amount";
import type { OperationalEntry } from "./entries-client-types";

const staleSummaryEntry = {
  type: "summary",
  amount: 100,
  salesChannels: [{ channelId: "card", amount: 5000 }],
} as OperationalEntry;

describe("resolveOperationalEntrySalesAmount", () => {
  it("prefers salesChannels sum for summary entries when filter is all", () => {
    expect(resolveOperationalEntrySalesAmount(staleSummaryEntry)).toBe(5000);
  });

  it("returns filtered channel amount when a channel filter is active", () => {
    expect(resolveOperationalEntrySalesAmount({
      type: "summary",
      amount: 150,
      salesChannels: [
        { channelId: "cash", amount: 100 },
        { channelId: "card", amount: 50 },
      ],
    } as OperationalEntry, "cash")).toBe(100);
  });

  it("returns outflow amount unchanged", () => {
    expect(resolveOperationalEntrySalesAmount({ type: "expense", amount: 25 } as OperationalEntry)).toBe(25);
  });
});

describe("signedOperationalEntryAmount", () => {
  it("keeps summary amounts positive and outflows negative", () => {
    expect(signedOperationalEntryAmount(staleSummaryEntry)).toBe(5000);
    expect(signedOperationalEntryAmount({ type: "expense", amount: 25 } as OperationalEntry)).toBe(-25);
  });
});

describe("sumOperationalSummaryEntryAmounts", () => {
  it("sums summary entries using channel-aware amounts", () => {
    expect(sumOperationalSummaryEntryAmounts([
      staleSummaryEntry,
      { type: "summary", amount: 10, salesChannels: [{ channelId: "cash", amount: 200 }] } as OperationalEntry,
    ])).toBe(5200);
  });
});

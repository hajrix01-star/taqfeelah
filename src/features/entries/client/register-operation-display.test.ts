import { describe, expect, it } from "vitest";
import type { OperationalEntry, OperationalEntrySalesChannelRow } from "./entries-client-types";
import {
  buildRegisterCloseoutDayContext,
  filterSummaryChannelRows,
  summaryEntryDisplayAmount,
  summarySalesChannelLabel,
} from "./register-operation-display";

const resolveChannelName = (row: OperationalEntrySalesChannelRow) => row.name || row.channelId || "";

describe("filterSummaryChannelRows", () => {
  it("returns only the filtered sales channel row", () => {
    const entry = {
      salesChannels: [
        { channelId: "cash", name: "نقد", amount: 100 },
        { channelId: "mada", name: "مدى", amount: 50 },
      ],
    };
    expect(filterSummaryChannelRows(entry as OperationalEntry, "cash")).toEqual([
      { channelId: "cash", name: "نقد", amount: 100 },
    ]);
  });
});

describe("summarySalesChannelLabel", () => {
  it("shows one channel label when channel filter is active", () => {
    const label = summarySalesChannelLabel({
      type: "summary",
      salesChannels: [
        { channelId: "cash", name: "نقد", amount: 100 },
        { channelId: "mada", name: "مدى", amount: 50 },
      ],
    } as OperationalEntry, resolveChannelName, "cash", "summary");

    expect(label).toBe("نقد");
  });
});

describe("summaryEntryDisplayAmount", () => {
  it("returns only the filtered channel amount for summary entries", () => {
    const amount = summaryEntryDisplayAmount({
      type: "summary",
      amount: 150,
      salesChannels: [
        { channelId: "cash", name: "نقد", amount: 100 },
        { channelId: "mada", name: "مدى", amount: 50 },
      ],
    } as OperationalEntry, "cash");

    expect(amount).toBe(100);
  });
});

describe("buildRegisterCloseoutDayContext", () => {
  it("tracks same-day closeout counts and fallback sequences", () => {
    const context = buildRegisterCloseoutDayContext([
      { businessId: "b1", date: "2026-06-06", closeoutId: "c1", daySequence: 1, createdAt: "2026-06-06T08:00:00Z" },
      { businessId: "b1", date: "2026-06-06", closeoutId: "c2", daySequence: 2, createdAt: "2026-06-06T10:00:00Z" },
    ]);

    expect(context.sameDayCloseoutCountByStoreDate.get("b1|2026-06-06")).toBe(2);
    expect(context.daySequenceByCloseoutId.get("c2")).toBe(2);
  });

  it("does not invent daySequence when trustServerDaySequenceOnly is true", () => {
    const context = buildRegisterCloseoutDayContext([
      { businessId: "b1", date: "2026-06-06", closeoutId: "c1", createdAt: "2026-06-06T08:00:00Z" },
      { businessId: "b1", date: "2026-06-06", closeoutId: "c2", daySequence: 2, createdAt: "2026-06-06T10:00:00Z" },
    ], { trustServerDaySequenceOnly: true });

    expect(context.sameDayCloseoutCountByStoreDate.get("b1|2026-06-06")).toBe(2);
    expect(context.daySequenceByCloseoutId.get("c1")).toBeNull();
    expect(context.daySequenceByCloseoutId.get("c2")).toBe(2);
  });
});

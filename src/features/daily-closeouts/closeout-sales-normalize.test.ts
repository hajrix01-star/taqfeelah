import { describe, expect, it } from "vitest";
import type { SalesChannelConfig } from "./daily-closeouts-types";
import {
  buildCloseoutSalesFromChannelValues,
  mergeCloseoutSalesFromChannelValues,
  normalizeCloseoutSalesToArray,
  sanitizeCloseoutChannelDisplayName,
} from "./closeout-sales-normalize";

describe("closeout-sales-normalize", () => {
  it("strips uuid-like display names", () => {
    expect(sanitizeCloseoutChannelDisplayName("036b5d76-001a-4650-9c62-fadcf7c0613f")).toBe("Channel");
    expect(sanitizeCloseoutChannelDisplayName("بطاقة")).toBe("بطاقة");
  });

  it("normalizes legacy object sales to array with human names", () => {
    const rows = normalizeCloseoutSalesToArray({
      card: { channelId: "card", name: "036b5d76-001a-4650-9c62-fadcf7c0613f", amount: 500 },
    });
    expect(rows).toEqual([{
      channelId: "card",
      name: "card",
      amount: 500,
    }]);
  });

  it("builds array-shaped sales for submit", () => {
    const rows = buildCloseoutSalesFromChannelValues(
      [{ id: "card", displayName: "بطاقة" }],
      { card: "250" },
    );
    expect(rows).toEqual([{ channelId: "card", name: "بطاقة", amount: 250 }]);
  });

  it("preserves api channel id on owner edit merge", () => {
    const apiChannelId = "036b5d76-001a-4650-9c62-fadcf7c0613f";
    const rows = mergeCloseoutSalesFromChannelValues(
      [{ id: "card", displayName: "بطاقة", apiChannelId } as SalesChannelConfig & { apiChannelId: string }],
      { card: 300 },
      [{ channelId: apiChannelId, name: "بطاقة", amount: 100 }],
    );
    expect(rows[0]?.channelId).toBe(apiChannelId);
    expect(rows[0]?.amount).toBe(300);
  });
});

import { describe, expect, it } from "vitest";
import { findCloseoutSalesRowForChannel } from "../daily-closeouts/closeout-sales-normalize";

/** Mirrors owner-edit hydration guard in use-daily-closeout-entry-state. */
function hydrateOwnerEditSalesValues(
  current: Record<string, string>,
  salesChannels: Array<{ id: string }>,
  salesRows: Array<{ channelId?: string; name?: string; amount?: number }>,
  labelChannel: (channel: { id: string }) => string,
): Record<string, string> {
  let changed = false;
  const next = { ...current };
  salesChannels.forEach((ch) => {
    if (Object.prototype.hasOwnProperty.call(next, ch.id)) return;
    const row = findCloseoutSalesRowForChannel(salesRows, ch, labelChannel(ch));
    if (!row) return;
    next[ch.id] = String(row.amount || "");
    changed = true;
  });
  return changed ? next : current;
}

describe("owner edit sales hydration", () => {
  it("does not re-hydrate channels already initialized with empty string values", () => {
    const current = { cash: "", card: "100" };
    const next = hydrateOwnerEditSalesValues(
      current,
      [{ id: "cash" }, { id: "card" }],
      [{ channelId: "cash", name: "نقد", amount: 0 }],
      (channel) => channel.id,
    );
    expect(next).toBe(current);
  });

  it("fills values for channels added after org-config hydration", () => {
    const current = { cash: "50" };
    const next = hydrateOwnerEditSalesValues(
      current,
      [{ id: "cash" }, { id: "card" }],
      [{ channelId: "card", name: "بطاقة", amount: 120 }],
      (channel) => channel.id,
    );
    expect(next).toEqual({ cash: "50", card: "120" });
  });
});

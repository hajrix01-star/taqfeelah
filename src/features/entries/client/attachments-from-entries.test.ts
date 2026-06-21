import { describe, expect, it } from "vitest";
import type { OperationalEntry } from "./entries-client-types";
import { groupAttachmentsFromEntries, resolveAttachmentGroupForDate } from "./attachments-from-entries";

describe("groupAttachmentsFromEntries", () => {
  it("groups attachment entries by date", () => {
    const groups = groupAttachmentsFromEntries([
      {
        id: "e1",
        date: "2026-06-06",
        amount: 10,
        reviewed: false,
        businessId: "b1",
        attachment: { id: "a1" },
        note: "Receipt",
      },
    ], (entry, lang) => (lang === "ar" ? entry.note || "" : entry.note || ""));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.date).toBe("2026-06-06");
    expect(groups[0]?.items?.[0]?.title).toBe("Receipt");
  });

  it("includes sales and purchase attachments for the same day", () => {
    const groups = groupAttachmentsFromEntries([
      {
        id: "e1",
        date: "2026-06-10",
        type: "summary",
        amount: 100,
        reviewed: false,
        businessId: "b1",
        attachment: { id: "a1" },
        salesChannels: [{ channelId: "cash", name: "نقدي", amount: 100 }],
      },
      {
        id: "e2",
        date: "2026-06-10",
        type: "purchases",
        amount: 40,
        reviewed: false,
        businessId: "b1",
        attachment: { id: "a2" },
        note: "فاتورة مشتريات",
      },
    ], (entry, lang) => (
      lang === "ar" ? (entry.note || entry.type || "") : (entry.note || entry.type || "")
    ));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items?.map((item) => item.id)).toEqual(["a1", "a2"]);
  });

  it("resolves the attachment group for the selected day", () => {
    const groups = [
      { dayId: "2026-06-09", date: "2026-06-09", items: [{ id: "old" }] },
      { dayId: "2026-06-10", date: "2026-06-10", items: [{ id: "today" }] },
    ];

    expect(resolveAttachmentGroupForDate(groups, "2026-06-10")?.items?.[0]?.id).toBe("today");
  });
});

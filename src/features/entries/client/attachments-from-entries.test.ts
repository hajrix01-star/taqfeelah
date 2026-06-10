import { describe, expect, it } from "vitest";
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
    ], (entry: { note: string }, lang: string) => (lang === "ar" ? entry.note : entry.note));

    expect(groups).toHaveLength(1);
    expect(groups[0].date).toBe("2026-06-06");
    expect(groups[0].items[0].title).toBe("Receipt");
  });

  it("resolves the attachment group for the selected day", () => {
    const groups = [
      { dayId: "2026-06-09", date: "2026-06-09", items: [{ id: "old" }] },
      { dayId: "2026-06-10", date: "2026-06-10", items: [{ id: "today" }] },
    ];

    expect(resolveAttachmentGroupForDate(groups, "2026-06-10")?.items[0].id).toBe("today");
  });
});

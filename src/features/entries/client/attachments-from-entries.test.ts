import { describe, expect, it } from "vitest";
import { groupAttachmentsFromEntries } from "./attachments-from-entries";

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
});

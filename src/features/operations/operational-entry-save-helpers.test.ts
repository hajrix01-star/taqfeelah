import { describe, expect, it } from "vitest";
import {
  buildCloseoutAlertRecord,
  findDuplicateSummaryEntries,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  resolveLatestActiveCloseoutDateFromEntries,
  resolveOperationalEntriesRefreshWarningMessage,
  resolveSuggestedEntryDate,
  upsertCloseoutAlert,
} from "./operational-entry-save-helpers";

const isActive = (entry: { status?: string }) => entry.status !== "voided";

describe("operational entry save helpers", () => {
  it("finds duplicate summary entries for same store/day", () => {
    const dupes = findDuplicateSummaryEntries([
      { id: "1", type: "summary", businessId: "shami", date: "2026-06-01", status: "active" },
      { id: "2", type: "summary", businessId: "shami", date: "2026-06-02", status: "active" },
    ], { businessId: "shami", date: "2026-06-01" }, isActive);

    expect(dupes.map((entry) => entry.id)).toEqual(["1"]);
  });

  it("resolves latest closeout date and merges store map", () => {
    expect(resolveLatestActiveCloseoutDateFromEntries([
      { businessId: "shami", type: "summary", date: "2026-06-01", status: "active" },
      { businessId: "shami", type: "summary", date: "2026-06-03", status: "active" },
    ], "shami", "2026-06-01", isActive)).toBe("2026-06-03");

    expect(mergeLastCloseoutDateForStore({ shami: "2026-06-01" }, "shami", "2026-06-03")).toEqual({
      shami: "2026-06-03",
    });
    expect(mergeLastCloseoutDateForStore({ shami: "2026-06-05" }, "shami", "2026-06-03")).toEqual({
      shami: "2026-06-05",
    });
  });

  it("builds and upserts closeout alerts", () => {
    const record = buildCloseoutAlertRecord(
      { businessId: "shami", date: "2026-06-01" },
      { id: "entry-1" },
      { nameAr: "أحمد", nameEn: "Ahmed" },
      100,
    );
    expect(record.id).toBe("co-entry-1");
    expect(upsertCloseoutAlert([{ id: "co-entry-1", seen: true }, { id: "co-old" }], record)).toEqual([
      record,
      { id: "co-old" },
    ]);
  });

  it("resolves suggested entry date and blocks future dates", () => {
    expect(resolveSuggestedEntryDate({
      lastCloseoutDate: "2026-06-01",
      todayDate: "2026-06-05",
      nextDay: (date) => `${date}-next`,
    })).toBe("2026-06-01-next");

    expect(resolveSuggestedEntryDate({
      lastCloseoutDate: null,
      todayDate: "2026-06-05",
      nextDay: (date) => date,
    })).toBe("2026-06-05");

    expect(isFutureOperationalEntryDate("2026-06-06", "2026-06-05")).toBe(true);
  });

  it("returns bilingual refresh warning after successful write with failed reload", () => {
    expect(resolveOperationalEntriesRefreshWarningMessage("ar")).toContain("تم الحفظ");
    expect(resolveOperationalEntriesRefreshWarningMessage("en")).toContain("Saved");
  });
});

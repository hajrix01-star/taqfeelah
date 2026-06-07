import { describe, expect, it } from "vitest";
import {
  employeeDisplayName,
  filterEmployeeHomePreviewEntries,
  filterEmployeeStoreEntries,
} from "./employee-entries-display";

describe("employee-entries-display", () => {
  const entries = [
    { id: "1", businessId: "b1", date: "2026-06-06", enteredBy: { userId: "e1", nameAr: "أحمد", nameEn: "Ahmed" }, type: "summary", amount: 10 },
    { id: "2", businessId: "b1", date: "2026-06-05", enteredBy: { userId: "e2", nameAr: "سارة", nameEn: "Sara" }, type: "expense", amount: 5 },
    { id: "3", businessId: "b2", date: "2026-06-06", enteredBy: { userId: "e1", nameAr: "أحمد", nameEn: "Ahmed" }, type: "summary", amount: 20 },
  ];

  it("formats employee display name from enteredBy", () => {
    expect(employeeDisplayName(entries[0], "ar")).toBe("أحمد");
    expect(employeeDisplayName(entries[0], "en")).toBe("Ahmed");
  });

  it("filters employee store entries", () => {
    const filtered = filterEmployeeStoreEntries(entries, "b1", "e1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("limits home preview entries", () => {
    const many = Array.from({ length: 6 }, (_, index) => ({
      id: `e-${index}`,
      businessId: "b1",
      date: `2026-06-${String(index + 1).padStart(2, "0")}`,
      enteredBy: { userId: "e1" },
    }));
    expect(filterEmployeeHomePreviewEntries(many, "b1", "e1", 4)).toHaveLength(4);
  });
});

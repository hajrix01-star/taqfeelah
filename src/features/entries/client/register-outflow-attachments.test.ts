import { describe, expect, it } from "vitest";
import {
  buildRegisterAttachmentGalleryModel,
  buildRegisterOutflowAttachmentItems,
  collectEntryAttachmentRefs,
  entryMatchesRegisterAttachmentGalleryFilters,
  filterRegisterAttachmentGalleryEntries,
  groupRegisterOutflowAttachmentItems,
  resolveRegisterAttachmentDaySection,
} from "./register-outflow-attachments";
import { DEFAULT_REGISTER_LOG_FILTERS } from "./register-log-display";

describe("register-outflow-attachments", () => {
  const expenseEntry = {
    id: "e1",
    type: "expense",
    status: "active",
    businessId: "b1",
    date: "2026-06-17",
    amount: 450,
    note: "صيانة",
    attachment: { id: "a1" },
  };

  const purchaseEntry = {
    id: "e2",
    type: "purchases",
    status: "active",
    businessId: "b1",
    date: "2026-06-16",
    amount: 1200,
    note: "مشتريات",
    attachments: [{ id: "a2" }, { id: "a3" }],
  };

  const summaryEntry = {
    id: "e3",
    type: "summary",
    status: "active",
    businessId: "b1",
    date: "2026-06-17",
    amount: 5000,
    attachment: { id: "a4" },
    salesChannels: [{ channelId: "cash", amount: 5000 }],
  };

  it("collects multiple attachment refs from an entry", () => {
    expect(collectEntryAttachmentRefs(purchaseEntry).map((item) => item.id)).toEqual(["a2", "a3"]);
    expect(collectEntryAttachmentRefs(expenseEntry).map((item) => item.id)).toEqual(["a1"]);
  });

  it("excludes summary and inflow entries from gallery filters", () => {
    expect(entryMatchesRegisterAttachmentGalleryFilters(summaryEntry, DEFAULT_REGISTER_LOG_FILTERS)).toBe(false);
    expect(entryMatchesRegisterAttachmentGalleryFilters(expenseEntry, DEFAULT_REGISTER_LOG_FILTERS)).toBe(true);
    expect(entryMatchesRegisterAttachmentGalleryFilters(
      expenseEntry,
      { ...DEFAULT_REGISTER_LOG_FILTERS, type: "summary" },
    )).toBe(false);
  });

  it("ignores sales channel filter for outflow gallery entries", () => {
    const filtered = filterRegisterAttachmentGalleryEntries(
      [expenseEntry, purchaseEntry],
      { ...DEFAULT_REGISTER_LOG_FILTERS, salesChannel: "cash" },
    );
    expect(filtered.map((entry) => entry.id)).toEqual(["e1", "e2"]);
  });

  it("builds flattened gallery items for outflow attachments only", () => {
    const items = buildRegisterOutflowAttachmentItems(
      [expenseEntry, purchaseEntry, summaryEntry],
      { resolveLabel: (entry, _lang) => (entry as { note?: string; type: string }).note || (entry as { type: string }).type },
    );
    expect(items).toHaveLength(3);
    expect(items[0].id).toContain("e1:a1");
    expect(items[0].amount).toBe(450);
  });

  it("groups gallery items into relative day sections", () => {
    const items = buildRegisterOutflowAttachmentItems([expenseEntry, purchaseEntry], {
      resolveLabel: (entry, _lang) => (entry as { note?: string; type: string }).note || (entry as { type: string }).type,
    });
    const sections = groupRegisterOutflowAttachmentItems(items, {
      todayIso: "2026-06-17",
      lang: "ar",
    });
    expect(sections[0].heading).toBe("اليوم");
    expect(sections[0].days[0].items).toHaveLength(1);
    expect(sections[1].heading).toBe("أمس");
  });

  it("resolves day section labels", () => {
    expect(resolveRegisterAttachmentDaySection("2026-06-17", "2026-06-17", "ar").heading).toBe("اليوم");
    expect(resolveRegisterAttachmentDaySection("2026-06-16", "2026-06-17", "ar").heading).toBe("أمس");
    expect(resolveRegisterAttachmentDaySection("2026-06-10", "2026-06-17", "ar").heading).toBe("هذا الأسبوع");
  });

  it("builds a full gallery model with counts", () => {
    const model = buildRegisterAttachmentGalleryModel(
      [expenseEntry, purchaseEntry, summaryEntry],
      DEFAULT_REGISTER_LOG_FILTERS,
      {
        resolveLabel: (entry, _lang) => (entry as { note?: string; type: string }).note || (entry as { type: string }).type,
        todayIso: "2026-06-17",
        lang: "ar",
      },
    );
    expect(model.count).toBe(3);
    expect(model.sections.length).toBeGreaterThan(0);
  });
});

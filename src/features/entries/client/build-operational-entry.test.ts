import { describe, expect, it } from "vitest";
import {
  buildOperationalEntry,
  createOperationalEntryId,
  makeOperationalEntryAttachment,
} from "./build-operational-entry";

describe("build operational entry", () => {
  it("creates summary entry with channel totals and attachment id", () => {
    const entry = buildOperationalEntry({
      businessId: "shami",
      date: "2026-06-01",
      type: "summary",
      salesChannels: [{ channelId: "cash", amount: 100 }, { channelId: "mada", amount: 50 }],
      attachment: { kind: "image", name: "receipt.jpg" },
    }, { role: "owner", userId: "owner", nameAr: "Owner", nameEn: "Owner" }, {
      createId: () => "summary-test",
      createdAt: "2026-06-01T10:00:00.000Z",
    });

    expect(entry.id).toBe("summary-test");
    expect(entry.amount).toBe(150);
    expect(entry.attachment).toEqual({ kind: "image", name: "receipt.jpg", id: "attachment-summary-test" });
    expect(entry.auditTrail[0].action).toBe("created");
  });

  it("creates outflow entry amount from parser", () => {
    const entry = buildOperationalEntry({
      businessId: "shami",
      date: "2026-06-01",
      type: "expense",
      amount: "120.5",
      categoryId: "rent",
    }, { role: "employee", userId: "ahmed" }, {
      createId: () => "expense-test",
      parseAmount: (value) => Number(value),
    });

    expect(entry.amount).toBe(120.5);
    expect(entry.categoryId).toBe("rent");
  });

  it("builds ids and attachment helpers", () => {
    expect(createOperationalEntryId("summary", 1)).toMatch(/^summary-1-/);
    expect(makeOperationalEntryAttachment("entry-1", { kind: "image" })).toEqual({
      kind: "image",
      id: "attachment-entry-1",
    });
  });
});

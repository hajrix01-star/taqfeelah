import { describe, expect, it } from "vitest";
import {
  attachmentDataUrlsFromList,
  buildCloseoutOutflowRow,
  resolveAttachmentPreviewSrc,
} from "./daily-closeout-entry-helpers";
import { computeCloseoutTotals } from "../daily-closeouts/closeout-calculations";

const proof = "data:image/jpeg;base64,/9j/4AAQ";

describe("buildCloseoutOutflowRow", () => {
  it("stores attachment data URLs on the outflow row", () => {
    const row = buildCloseoutOutflowRow({
      lang: "ar",
      outType: "purchases",
      expenseCategory: "maintenance",
      outNote: "فاتورة بقالة",
      amountValue: "120",
      attachments: [proof],
    });

    expect(row).toMatchObject({
      type: "purchases",
      typeLabel: "مشتريات",
      amount: 120,
      attachments: [proof],
    });
  });

  it("accepts prepared attachment objects with dataUrl", () => {
    const row = buildCloseoutOutflowRow({
      lang: "en",
      outType: "expense",
      expenseCategory: "electricity",
      outNote: "Bill",
      amountValue: "50",
      attachments: [{ dataUrl: proof }],
    });

    expect(row?.attachments).toEqual([proof]);
    expect(row?.typeLabel).toBe("Expense");
  });
});

describe("closeout review totals contract", () => {
  it("counts only committed outflow rows, not draft field values", () => {
    const totals = computeCloseoutTotals(
      { cash: 100 },
      [{ id: "out-1", type: "purchases", amount: 25 }],
    );
    expect(totals.totalSales).toBe(100);
    expect(totals.totalOutflow).toBe(25);
    expect(totals.netMovement).toBe(75);
  });

  it("ignores a typed outflow amount until pushOutflow adds a row", () => {
    const committedOnly = computeCloseoutTotals({ cash: 500 }, []);
    expect(committedOnly.totalOutflow).toBe(0);
    expect(committedOnly.netMovement).toBe(500);
  });
});

describe("attachmentDataUrlsFromList", () => {
  it("normalizes strings and attachment objects", () => {
    expect(attachmentDataUrlsFromList([proof, { dataUrl: proof }, "invalid", null])).toEqual([proof, proof]);
  });
});

describe("resolveAttachmentPreviewSrc", () => {
  it("returns data URLs from strings and prepared attachment objects", () => {
    expect(resolveAttachmentPreviewSrc(proof)).toBe(proof);
    expect(resolveAttachmentPreviewSrc({ dataUrl: proof })).toBe(proof);
    expect(resolveAttachmentPreviewSrc("invalid")).toBe("");
  });
});

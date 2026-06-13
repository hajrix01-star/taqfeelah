import { describe, expect, it } from "vitest";
import {
  attachmentDataUrlsFromList,
  buildCloseoutOutflowRow,
} from "./daily-closeout-entry-helpers";

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

describe("attachmentDataUrlsFromList", () => {
  it("normalizes strings and attachment objects", () => {
    expect(attachmentDataUrlsFromList([proof, { dataUrl: proof }, "invalid", null])).toEqual([proof, proof]);
  });
});

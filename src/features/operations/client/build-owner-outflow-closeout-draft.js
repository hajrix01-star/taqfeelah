import { buildCloseoutOutflowRow } from "@/features/employee-closeouts/daily-closeout-entry-helpers";

function outflowAttachmentsFromPayload(attachment) {
  if (!attachment) return [];
  if (typeof attachment === "string" && attachment.startsWith("data:")) return [attachment];
  if (typeof attachment?.dataUrl === "string" && attachment.dataUrl.startsWith("data:")) {
    return [attachment.dataUrl];
  }
  return [];
}

/**
 * Build a closeout draft for owner standalone outflow submit (no sales/income).
 */
export function buildOwnerOutflowCloseoutDraft(payload, lang = "ar") {
  const businessId = String(payload?.businessId || "").trim();
  const date = String(payload?.date || "").trim();
  const outType = payload?.type === "expense" || payload?.type === "withdrawal"
    ? payload.type
    : "purchases";
  const outflowRow = buildCloseoutOutflowRow({
    lang,
    outType,
    expenseCategory: outType === "expense" ? String(payload?.categoryId || "other") : null,
    outNote: payload?.note || "",
    amountValue: payload?.amount,
  });
  if (!businessId || !date || !outflowRow) return null;

  const attachments = outflowAttachmentsFromPayload(payload?.attachment);
  return {
    id: `owner-outflow-${Date.now()}`,
    storeId: businessId,
    date,
    sales: {},
    outflows: [{
      ...outflowRow,
      attachments,
    }],
    attachments: [],
    note: "",
  };
}

export function isOwnerStandaloneOutflowPayload(payload) {
  const type = String(payload?.type || "");
  return type === "expense" || type === "purchases" || type === "withdrawal";
}

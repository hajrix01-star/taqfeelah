import { buildCloseoutOutflowRow } from "@/features/employee-closeouts/daily-closeout-entry-helpers";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OwnerOutflowCloseoutPayload } from "./operations-client-types";

export type OwnerOutflowCloseoutDraft = {
  id: string;
  storeId: string;
  date: string;
  sales: Record<string, never>;
  outflows: Array<Record<string, unknown>>;
  attachments: unknown[];
  note: string;
};

function outflowAttachmentsFromPayload(
  attachment: unknown,
): string[] {
  if (!attachment) return [];
  if (typeof attachment === "string" && attachment.startsWith("data:")) return [attachment];
  if (
    typeof attachment === "object"
    && attachment !== null
    && typeof (attachment as { dataUrl?: string }).dataUrl === "string"
    && (attachment as { dataUrl: string }).dataUrl.startsWith("data:")
  ) {
    return [(attachment as { dataUrl: string }).dataUrl];
  }
  return [];
}

export function buildOwnerOutflowCloseoutDraft(
  payload: OwnerOutflowCloseoutPayload,
  lang: DisplayLang = "ar",
): OwnerOutflowCloseoutDraft | null {
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
    sales: {} as Record<string, never>,
    outflows: [{
      ...outflowRow,
      attachments,
    }],
    attachments: [],
    note: "",
  };
}

export function isOwnerStandaloneOutflowPayload(payload: OwnerOutflowCloseoutPayload): boolean {
  const type = String(payload?.type || "");
  return type === "expense" || type === "purchases" || type === "withdrawal";
}

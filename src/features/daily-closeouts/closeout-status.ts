export type CloseoutStatusValue = "draft" | "submitted" | "reviewed" | "returned";
export type CloseoutStatusTone = "muted" | "pending" | "warning" | "success";

export const CLOSEOUT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  RETURNED: "returned",
} as const satisfies Record<string, CloseoutStatusValue>;

type StatusLabelOptions = {
  reviewWorkflowEnabled?: boolean;
  autoRecorded?: boolean;
};

export function closeoutStatusLabel(
  status: string,
  lang: "ar" | "en" = "ar",
  { reviewWorkflowEnabled = false, autoRecorded = false }: StatusLabelOptions = {},
): string {
  const ar: Record<string, string> = {
    draft: "مسودة (غير مرسلة)",
    submitted: "بانتظار المراجعة",
    reviewed: autoRecorded || !reviewWorkflowEnabled ? "تم الإرسال" : "تمت المراجعة",
    returned: "تحتاج تعديل",
  };
  const en: Record<string, string> = {
    draft: "In progress",
    submitted: "Pending review",
    reviewed: autoRecorded || !reviewWorkflowEnabled ? "Sent" : "Reviewed",
    returned: "Needs edit",
  };
  const map = lang === "ar" ? ar : en;
  return map[status] || status;
}

export function closeoutStatusTone(status: string): CloseoutStatusTone {
  if (status === CLOSEOUT_STATUS.DRAFT) return "muted";
  if (status === CLOSEOUT_STATUS.SUBMITTED) return "pending";
  if (status === CLOSEOUT_STATUS.RETURNED) return "warning";
  return "success";
}

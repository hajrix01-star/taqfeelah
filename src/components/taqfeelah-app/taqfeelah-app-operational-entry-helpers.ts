import { summaryDayFromEntries } from "@/features/operations/operational-analytics";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import type { FormatDayLabelFn } from "@/features/operations/operations-types";
import { buildOperationalEntry } from "@/features/entries/client/build-operational-entry";
import { groupAttachmentsFromEntries } from "@/features/entries/client/attachments-from-entries";
import { toAmount } from "./taqfeelah-app-entry-form-utils";
import { noteLabel } from "./taqfeelah-app-entry-helpers";
import { opTime } from "./taqfeelah-app-catalog-data";
import { isoCalendarDate } from "./taqfeelah-app-notebook";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
  AppLang,
  AppOwnerActor,
} from "./taqfeelah-app-types";
import type { DisplayLang } from "@/core/i18n/display-locale";

export const defaultOwnerActor: AppOwnerActor = { role: "owner", userId: "owner", nameAr: "محمد الهاجري", nameEn: "Mohammad Alhajri" };

const newId = (prefix = "entry") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}
export function entryCreatedAt(isoDate: string, hour: number, minute = 0) {
  const stamp = new Date(`${isoDate}T12:00:00`);
  stamp.setHours(hour, minute, 0, 0);
  return stamp.toISOString();
}
export function createLocalAttachmentStub(id: string) {
  return { id, kind: "image", name: "receipt.jpg", mimeType: "image/jpeg", sizeBytes: 18400 };
}
type LocalEntryPartial = Partial<OperationalEntry> & {
  amountInput?: string | number;
  salesChannels?: Array<{ channelId?: string; amount: number }>;
};
export function createLocalOperationalEntry(partial: LocalEntryPartial) {
  const id = partial.id || newId(partial.type);
  const createdAt = partial.createdAt || entryCreatedAt(partial.date || "", 12, 0);
  const amount = partial.amount ?? (partial.type === "summary"
    ? (partial.salesChannels || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
    : toAmount(partial.amountInput ?? 0));
  return {
    id,
    businessId: partial.businessId,
    date: partial.date,
    createdAt,
    type: partial.type,
    categoryId: partial.categoryId || null,
    amount,
    salesChannels: partial.salesChannels || [],
    note: partial.note || "",
    noteKey: partial.noteKey || null,
    enteredBy: partial.enteredBy || defaultOwnerActor,
    attachment: partial.attachment ? { ...partial.attachment, id: partial.attachment.id || `attachment-${id}` } : null,
    reviewed: partial.reviewed ?? false,
    status: partial.status || "active",
    voidedAt: partial.voidedAt || null,
    voidedBy: partial.voidedBy || null,
    voidReason: partial.voidReason || "",
    restoredAt: partial.restoredAt || null,
    restoredBy: partial.restoredBy || null,
    restoreReason: partial.restoreReason || "",
    auditTrail: partial.auditTrail || [{ action: "created", at: createdAt, by: partial.enteredBy || defaultOwnerActor, reason: "" }],
  } as OperationalEntry;
}
export function createLocalOperationalEntries() {
  return [];
}
export function readOperationalEntries(): OperationalEntry[] {
  return [];
}
export function summaryDayFromEntriesWithLabels(entries: OperationalEntry[], businessId: string, date: string) {
  return summaryDayFromEntries(entries, businessId, date, formatCalendarDate as FormatDayLabelFn);
}
export function operationTime(item: OperationalEntry, lang: AppLang) {
  if (!item.createdAt) return opTime(item, lang);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt));
}
export function buildEntry(payload: OperationalEntryPayload, actor: OperationalEntryActor) {
  return buildOperationalEntry(payload, actor, {
    createId: () => newId(payload.type),
    parseAmount: toAmount,
  });
}
export function attachmentsFromEntries(entries: OperationalEntry[]) {
  return groupAttachmentsFromEntries(entries, noteLabel as (entry: OperationalEntry, lang: DisplayLang | string) => string);
}

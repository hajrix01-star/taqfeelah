import { entryHasAttachment, newestEntries } from "@/features/operations/operational-analytics";
import type {
  HomeAttachmentGroup,
  NoteLabelResolver,
  OperationalEntry,
} from "./entries-client-types";

export function groupAttachmentsFromEntries(
  entries: OperationalEntry[],
  resolveNoteLabel: NoteLabelResolver,
): HomeAttachmentGroup[] {
  const grouped = new Map<string, NonNullable<HomeAttachmentGroup>["items"]>();
  newestEntries((Array.isArray(entries) ? entries : []).filter(entryHasAttachment)).forEach((entry) => {
    const date = entry.date || "";
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push({
      id: entry.attachment!.id!,
      entryId: entry.id,
      title: resolveNoteLabel(entry, "ar"),
      titleEn: resolveNoteLabel(entry, "en"),
      amount: entry.amount,
      reviewed: entry.reviewed,
      businessId: entry.businessId,
      attachment: entry.attachment ?? undefined,
      entry,
    });
  });
  return [...grouped.entries()].map(([date, items]) => ({ dayId: date, date, items }));
}

export function resolveAttachmentGroupForDate(
  groups: HomeAttachmentGroup[],
  selectedDate: string,
): HomeAttachmentGroup {
  const list = Array.isArray(groups) ? groups : [];
  if (!selectedDate) return list[0] || null;
  return list.find((group) => group?.date === selectedDate) || list[0] || null;
}

import { entryHasAttachment, newestEntries } from "@/features/operations/operational-analytics";

export function groupAttachmentsFromEntries(entries, resolveNoteLabel) {
  const grouped = new Map();
  newestEntries((Array.isArray(entries) ? entries : []).filter(entryHasAttachment)).forEach((entry) => {
    if (!grouped.has(entry.date)) grouped.set(entry.date, []);
    grouped.get(entry.date).push({
      id: entry.attachment.id,
      entryId: entry.id,
      title: resolveNoteLabel(entry, "ar"),
      titleEn: resolveNoteLabel(entry, "en"),
      amount: entry.amount,
      reviewed: entry.reviewed,
      businessId: entry.businessId,
      attachment: entry.attachment,
      entry,
    });
  });
  return [...grouped.entries()].map(([date, items]) => ({ dayId: date, date, items }));
}

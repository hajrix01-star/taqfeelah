import {
  entryCategoryForLogFilter,
  entryMatchesRegisterLogFilters,
} from "@/features/entries/client/register-log-display";
import {
  entryHasAttachment,
  entryIsOutflow,
  newestEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  AttachmentRef,
  OperationalEntry,
  OperationalEntryAttachment,
  RegisterAttachmentGalleryOptions,
  RegisterLogFilters,
  RegisterOutflowAttachmentItem,
} from "./entries-client-types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

function dayDiffFromToday(date: string, todayIso: string): number {
  const today = parseIsoDate(todayIso);
  const target = parseIsoDate(date);
  if (!today || !target) return Number.POSITIVE_INFINITY;
  return Math.round((today.getTime() - target.getTime()) / MS_PER_DAY);
}

function normalizeAttachmentRef(
  attachment: OperationalEntryAttachment,
  index = 0,
): AttachmentRef | null {
  if (!attachment || typeof attachment !== "object") return null;
  const id = typeof attachment.id === "string" ? attachment.id : `attachment-${index}`;
  return {
    id,
    kind: String(attachment.kind || "image"),
    name: String(attachment.name || attachment.originalFileName || "attachment.jpg"),
    mimeType: String(attachment.mimeType || "image/jpeg"),
    sizeBytes: Number(attachment.sizeBytes || 0),
    dataUrl: typeof attachment.dataUrl === "string" ? attachment.dataUrl : null,
  };
}

export function collectEntryAttachmentRefs(entry: OperationalEntry): AttachmentRef[] {
  const refs: AttachmentRef[] = [];
  if (Array.isArray(entry?.attachments)) {
    entry.attachments.forEach((attachment, index) => {
      const normalized = normalizeAttachmentRef(attachment, index);
      if (normalized) refs.push(normalized);
    });
  }
  if (!refs.length && entry?.attachment) {
    const normalized = normalizeAttachmentRef(entry.attachment, 0);
    if (normalized) refs.push(normalized);
  }
  return refs;
}

export function entryQualifiesForRegisterAttachmentsGallery(entry: OperationalEntry): boolean {
  return entryIsOutflow(entry) && entryHasAttachment(entry);
}

export function entryMatchesRegisterAttachmentGalleryFilters(
  entry: OperationalEntry,
  filters: RegisterLogFilters,
  resolveExpenseCategory: (entry: OperationalEntry) => string = entryCategoryForLogFilter,
  configuredChannels: Array<Record<string, unknown>> = [],
): boolean {
  if (!entryQualifiesForRegisterAttachmentsGallery(entry)) return false;
  if (filters?.type === "summary") return false;
  if (filters?.type && filters.type !== "all" && entry.type !== filters.type) return false;

  const galleryFilters: RegisterLogFilters = {
    ...filters,
    salesChannel: "all",
    attachmentOnly: false,
  };
  return entryMatchesRegisterLogFilters(
    entry,
    galleryFilters,
    resolveExpenseCategory,
    configuredChannels,
  );
}

export function filterRegisterAttachmentGalleryEntries(
  entries: OperationalEntry[],
  filters: RegisterLogFilters,
  resolveExpenseCategory: (entry: OperationalEntry) => string = entryCategoryForLogFilter,
  configuredChannels: Array<Record<string, unknown>> = [],
): OperationalEntry[] {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryMatchesRegisterAttachmentGalleryFilters(
      entry,
      filters,
      resolveExpenseCategory,
      configuredChannels,
    ),
  );
}

export type RegisterAttachmentDaySection = {
  id: string;
  heading: string;
  sort: number;
};

export function resolveRegisterAttachmentDaySection(
  date: string,
  todayIso: string,
  lang: DisplayLang | string = "ar",
): RegisterAttachmentDaySection {
  const diffDays = dayDiffFromToday(date, todayIso);
  if (diffDays === 0) {
    return { id: "today", heading: lang === "ar" ? "اليوم" : "Today", sort: 0 };
  }
  if (diffDays === 1) {
    return { id: "yesterday", heading: lang === "ar" ? "أمس" : "Yesterday", sort: 1 };
  }
  if (diffDays > 1 && diffDays <= 7) {
    return { id: "this-week", heading: lang === "ar" ? "هذا الأسبوع" : "This week", sort: 2 };
  }
  if (date.slice(0, 7) === todayIso.slice(0, 7)) {
    return { id: "this-month", heading: lang === "ar" ? "هذا الشهر" : "This month", sort: 3 };
  }
  if (date.slice(0, 4) === todayIso.slice(0, 4)) {
    const monthDate = parseIsoDate(`${date.slice(0, 7)}-01`);
    const heading = monthDate
      ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "long" }).format(monthDate)
      : formatCalendarDate(date, lang);
    return { id: `month-${date.slice(0, 7)}`, heading, sort: 4 };
  }
  return {
    id: `date-${date}`,
    heading: formatCalendarDate(date, lang),
    sort: 5,
  };
}

export function buildRegisterOutflowAttachmentItems(
  entries: OperationalEntry[],
  {
    resolveLabel = (entry: OperationalEntry, lang: DisplayLang) => (lang === "ar" ? entry.note : entry.note) || entry.type || "",
    lang = "ar" as DisplayLang,
  }: {
    resolveLabel?: (entry: OperationalEntry, lang: DisplayLang) => string;
    lang?: DisplayLang;
  } = {},
): RegisterOutflowAttachmentItem[] {
  const items: RegisterOutflowAttachmentItem[] = [];
  newestEntries(Array.isArray(entries) ? entries : [])
    .filter(entryQualifiesForRegisterAttachmentsGallery)
    .forEach((entry) => {
      collectEntryAttachmentRefs(entry).forEach((attachment, attachmentIndex) => {
        items.push({
          id: `${entry.id}:${attachment.id}:${attachmentIndex}`,
          entryId: entry.id || "",
          attachment,
          entry,
          date: entry.date || "",
          businessId: entry.businessId,
          amount: Number(entry.amount || 0),
          label: resolveLabel(entry, lang),
          labelEn: resolveLabel(entry, "en"),
          voided: entry.status === "voided",
        });
      });
    });
  return items.sort((left, right) => {
    if (left.date !== right.date) return right.date.localeCompare(left.date);
    const leftStamp = `${left.date}|${left.entry?.createdAt || ""}|${left.id}`;
    const rightStamp = `${right.date}|${right.entry?.createdAt || ""}|${right.id}`;
    return rightStamp.localeCompare(leftStamp);
  });
}

export type RegisterOutflowAttachmentSection = {
  id: string;
  heading: string;
  days: Array<{
    date: string;
    dateLabel: string;
    items: RegisterOutflowAttachmentItem[];
  }>;
};

export function groupRegisterOutflowAttachmentItems(
  items: RegisterOutflowAttachmentItem[],
  { todayIso = "", lang = "ar" as DisplayLang }: { todayIso?: string; lang?: DisplayLang } = {},
): RegisterOutflowAttachmentSection[] {
  const sectionMap = new Map<string, RegisterOutflowAttachmentSection & { sort: number; newestDate: string }>();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const section = resolveRegisterAttachmentDaySection(item.date, todayIso, lang);
    const sectionKey = section.id;
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        ...section,
        newestDate: "",
        days: [],
      });
    }
    const sectionGroup = sectionMap.get(sectionKey)!;
    let dayGroup = sectionGroup.days.find((day) => day.date === item.date);
    if (!dayGroup) {
      dayGroup = {
        date: item.date,
        dateLabel: formatCalendarDate(item.date, lang),
        items: [],
      };
      sectionGroup.days.push(dayGroup);
    }
    dayGroup.items.push(item);
  });

  return [...sectionMap.values()]
    .map((section) => {
      const days = [...section.days].sort((left, right) => right.date.localeCompare(left.date));
      const newestDate = days[0]?.date || "";
      return {
        id: section.id,
        heading: section.heading,
        sort: section.sort,
        newestDate,
        days,
      };
    })
    .sort((left, right) => (
      left.sort - right.sort
      || right.newestDate.localeCompare(left.newestDate)
      || left.heading.localeCompare(right.heading, lang)
    ))
    .map(({ id, heading, days }) => ({ id, heading, days }));
}

export function buildRegisterAttachmentGalleryModel(
  entries: OperationalEntry[],
  filters: RegisterLogFilters,
  {
    resolveLabel,
    resolveExpenseCategory,
    configuredChannels = [],
    todayIso = "",
    lang = "ar" as DisplayLang,
  }: RegisterAttachmentGalleryOptions = {},
): {
  items: RegisterOutflowAttachmentItem[];
  sections: RegisterOutflowAttachmentSection[];
  count: number;
} {
  const filteredEntries = filterRegisterAttachmentGalleryEntries(
    entries,
    filters,
    resolveExpenseCategory,
    configuredChannels,
  );
  const items = buildRegisterOutflowAttachmentItems(filteredEntries, { resolveLabel, lang });
  const sections = groupRegisterOutflowAttachmentItems(items, { todayIso, lang });
  return {
    items,
    sections,
    count: items.length,
  };
}

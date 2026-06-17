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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

function dayDiffFromToday(date, todayIso) {
  const today = parseIsoDate(todayIso);
  const target = parseIsoDate(date);
  if (!today || !target) return Number.POSITIVE_INFINITY;
  return Math.round((today.getTime() - target.getTime()) / MS_PER_DAY);
}

function normalizeAttachmentRef(attachment, index = 0) {
  if (!attachment || typeof attachment !== "object") return null;
  const id = typeof attachment.id === "string" ? attachment.id : `attachment-${index}`;
  return {
    id,
    kind: attachment.kind || "image",
    name: attachment.name || attachment.originalFileName || "attachment.jpg",
    mimeType: attachment.mimeType || "image/jpeg",
    sizeBytes: Number(attachment.sizeBytes || 0),
    dataUrl: attachment.dataUrl || null,
  };
}

export function collectEntryAttachmentRefs(entry) {
  const refs = [];
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

export function entryQualifiesForRegisterAttachmentsGallery(entry) {
  return entryIsOutflow(entry) && entryHasAttachment(entry);
}

export function entryMatchesRegisterAttachmentGalleryFilters(
  entry,
  filters,
  resolveExpenseCategory = entryCategoryForLogFilter,
  configuredChannels = [],
) {
  if (!entryQualifiesForRegisterAttachmentsGallery(entry)) return false;
  if (filters?.type === "summary") return false;
  if (filters?.type && filters.type !== "all" && entry.type !== filters.type) return false;

  const galleryFilters = {
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
  entries,
  filters,
  resolveExpenseCategory = entryCategoryForLogFilter,
  configuredChannels = [],
) {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryMatchesRegisterAttachmentGalleryFilters(
      entry,
      filters,
      resolveExpenseCategory,
      configuredChannels,
    ),
  );
}

export function resolveRegisterAttachmentDaySection(date, todayIso, lang = "ar") {
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

/**
 * @param {object[]} entries
 * @param {{
 *   resolveLabel?: (entry: object, lang: string) => string,
 *   lang?: "ar" | "en",
 * }} [options]
 */
export function buildRegisterOutflowAttachmentItems(
  entries,
  {
    resolveLabel = (entry, lang) => (lang === "ar" ? entry.note : entry.note) || entry.type,
    lang = "ar",
  } = {},
) {
  const items = [];
  newestEntries(Array.isArray(entries) ? entries : [])
    .filter(entryQualifiesForRegisterAttachmentsGallery)
    .forEach((entry) => {
      collectEntryAttachmentRefs(entry).forEach((attachment, attachmentIndex) => {
        items.push({
          id: `${entry.id}:${attachment.id}:${attachmentIndex}`,
          entryId: entry.id,
          attachment,
          entry,
          date: entry.date,
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

export function groupRegisterOutflowAttachmentItems(items, { todayIso = "", lang = "ar" } = {}) {
  const sectionMap = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const section = resolveRegisterAttachmentDaySection(item.date, todayIso, lang);
    const sectionKey = section.id;
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        ...section,
        days: new Map(),
      });
    }
    const sectionGroup = sectionMap.get(sectionKey);
    if (!sectionGroup.days.has(item.date)) {
      sectionGroup.days.set(item.date, {
        date: item.date,
        dateLabel: formatCalendarDate(item.date, lang),
        items: [],
      });
    }
    sectionGroup.days.get(item.date).items.push(item);
  });

  return [...sectionMap.values()]
    .map((section) => {
      const days = [...section.days.values()].sort((left, right) => right.date.localeCompare(left.date));
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

/**
 * @param {object[]} entries
 * @param {object} filters
 * @param {{
 *   resolveLabel?: (entry: object, lang: string) => string,
 *   resolveExpenseCategory?: (entry: object) => string,
 *   configuredChannels?: object[],
 *   todayIso?: string,
 *   lang?: "ar" | "en",
 * }} [options]
 */
export function buildRegisterAttachmentGalleryModel(
  entries,
  filters,
  {
    resolveLabel,
    resolveExpenseCategory,
    configuredChannels = [],
    todayIso = "",
    lang = "ar",
  } = {},
) {
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

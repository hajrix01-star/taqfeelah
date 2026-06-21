import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import { formatChecklistForShare } from "./owner-notebook-checklist";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OwnerNotebookNote } from "@/features/owner-notebook/owner-notebook-types";
import type { OwnerNotebookShareLabels } from "@/features/owner-notebook/client/owner-notebook-client-types";

function formatNoteShareTime(iso: string, lang: DisplayLang) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ownerNotebookKindLabel(
  note: OwnerNotebookNote,
  lang: DisplayLang,
  labels: OwnerNotebookShareLabels = {},
) {
  if (note.kind === "task") {
    if (note.done) return labels.done || (lang === "ar" ? "مهمة منجزة" : "Completed task");
    return labels.task || (lang === "ar" ? "مهمة" : "Task");
  }
  return labels.note || (lang === "ar" ? "ملاحظة" : "Note");
}

export function buildOwnerNotebookShareCaption(
  note: OwnerNotebookNote | null | undefined,
  lang: DisplayLang,
  labels: OwnerNotebookShareLabels = {},
) {
  if (!note) return "";
  const kind = ownerNotebookKindLabel(note, lang, labels);
  const when = formatNoteShareTime(note.updatedAt || note.createdAt, lang);
  const checklistText = formatChecklistForShare(note.checklist || []);
  const lines = [
    lang === "ar" ? `دفتري — ${kind}` : `My notebook — ${kind}`,
    when,
  ];
  if (note.text?.trim()) lines.push(note.text.trim());
  if (checklistText) lines.push(checklistText);
  return lines.join("\n");
}

export function ownerNotebookShareFilename(note: OwnerNotebookNote | null | undefined, lang: DisplayLang) {
  const stamp = (note?.updatedAt || note?.createdAt || "").slice(0, 10) || "note";
  return `${lang === "ar" ? "دفتري" : "daftari"}-${stamp}-${String(note?.id || "note").slice(-6)}.png`;
}

export async function shareOwnerNotebookNoteImage({
  file,
  caption,
  lang,
  title = "",
}: {
  file: File | null;
  caption: string;
  lang: DisplayLang;
  title?: string;
}) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: title || (lang === "ar" ? "دفتري" : "My notebook"),
  });
}

export { formatNoteShareTime };

import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";

function formatNoteShareTime(iso, lang) {
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

export function ownerNotebookKindLabel(note, lang, labels = {}) {
  if (note.kind === "task") {
    if (note.done) return labels.done || (lang === "ar" ? "مهمة منجزة" : "Completed task");
    return labels.task || (lang === "ar" ? "مهمة" : "Task");
  }
  return labels.note || (lang === "ar" ? "ملاحظة" : "Note");
}

export function buildOwnerNotebookShareCaption(note, lang, labels = {}) {
  if (!note?.text) return "";
  const kind = ownerNotebookKindLabel(note, lang, labels);
  const when = formatNoteShareTime(note.updatedAt || note.createdAt, lang);
  return [
    lang === "ar" ? `دفتري — ${kind}` : `My notebook — ${kind}`,
    when,
    note.text.trim(),
  ].join("\n");
}

export function ownerNotebookShareFilename(note, lang) {
  const stamp = (note?.updatedAt || note?.createdAt || "").slice(0, 10) || "note";
  return `${lang === "ar" ? "دفتري" : "daftari"}-${stamp}-${String(note?.id || "note").slice(-6)}.png`;
}

export async function shareOwnerNotebookNoteImage({ file, caption, lang, title = "" }) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: title || (lang === "ar" ? "دفتري" : "My notebook"),
  });
}

export { formatNoteShareTime };

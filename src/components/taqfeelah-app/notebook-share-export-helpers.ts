import { shareOwnerCloseoutImage } from "@/features/owner-notebook/owner-closeout-share";
import { exportProfessionalExcel } from "@/features/exports/client/export-professional-excel";
import { exportProfessionalPdf } from "@/features/exports/client/export-professional-pdf";
import type { ProfessionalExportPayload } from "@/features/exports/client/exports-client-types";
import type { DisplayLang, NotebookShareExportPayload } from "./taqfeelah-app-types";

export function downloadBlobFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function captureNotebookPreviewBlob(element: HTMLElement, backgroundColor = "#FFFDF7") {
  const { captureNotebookShareBlob } = await import("@/features/daily-closeouts/notebook-share-capture");
  return captureNotebookShareBlob(element, backgroundColor);
}

export async function shareNotebookImageToWhatsApp(file: File, caption: string, lang: DisplayLang) {
  return shareOwnerCloseoutImage({ file, caption, lang });
}

export async function exportNotebookShareExcel(exportPayload: NotebookShareExportPayload) {
  await exportProfessionalExcel(exportPayload as ProfessionalExportPayload);
}

export function exportNotebookSharePdf(exportPayload: NotebookShareExportPayload) {
  exportProfessionalPdf(exportPayload as ProfessionalExportPayload);
}

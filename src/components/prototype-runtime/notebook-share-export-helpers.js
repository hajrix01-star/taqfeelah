import { shareOwnerCloseoutImage } from "@/features/owner-notebook/owner-closeout-share";
import { exportProfessionalExcel } from "@/features/exports/client/export-professional-excel";
import { exportProfessionalPdf } from "@/features/exports/client/export-professional-pdf";

export function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function captureNotebookPreviewBlob(element, backgroundColor = "#FFFDF7") {
  const { captureNotebookShareBlob } = await import("@/features/daily-closeouts/notebook-share-capture");
  return captureNotebookShareBlob(element, backgroundColor);
}

export async function shareNotebookImageToWhatsApp(file, caption, lang) {
  return shareOwnerCloseoutImage({ file, caption, lang });
}

export async function exportNotebookShareExcel(exportPayload) {
  await exportProfessionalExcel(exportPayload);
}

export function exportNotebookSharePdf(exportPayload) {
  exportProfessionalPdf(exportPayload);
}

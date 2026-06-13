import { shareOwnerCloseoutImage } from "@/features/owner-notebook/owner-closeout-share";
import { text } from "./prototype-runtime-demo-data";

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

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function exportNotebookShareExcel(exportTable, safeExportName) {
  const rows = [exportTable.headers, ...exportTable.rows];
  const csvRows = rows.map((row) => row.map(csvCell).join(","));
  const csv = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlobFile(blob, `${safeExportName}.csv`);
}

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function exportNotebookSharePdf({
  lang,
  safeExportName,
  exportTitle,
  periodLabel,
  title,
  combined,
  exportTable,
}) {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;
  const direction = lang === "ar" ? "rtl" : "ltr";
  const headerHtml = exportTable.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rowsHtml = exportTable.rows.map((row) => `<tr>${exportTable.headers.map((_, index) => `<td>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("");
  printWindow.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="UTF-8"><title>${escapeHtml(safeExportName)}</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#112A46;padding:42px;background:#fff}header{border-bottom:3px solid #C28A30;padding-bottom:18px;margin-bottom:24px}h1{font-size:26px;margin:0 0 10px;font-weight:800}p{margin:4px 0;color:#716753;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th{background:#112A46;color:#fff;text-align:${lang === "ar" ? "right" : "left"};padding:12px}td{padding:12px;border-bottom:1px solid #E6DFD1;font-weight:600}tr:last-child td{font-weight:800;border-top:2px solid #C28A30}footer{margin-top:30px;color:#827762;font-size:11px}@media print{body{padding:20px}}</style></head><body><header><h1>${escapeHtml(exportTitle)}</h1><p>${escapeHtml(periodLabel)}</p>${!combined ? `<p>${escapeHtml(title)}</p>` : ""}</header><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><footer>${escapeHtml(text(lang, "operationalOnly"))}</footer><script>window.onload = () => { window.print(); };<\/script></body></html>`);
  printWindow.document.close();
}

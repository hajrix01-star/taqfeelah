const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function formatCellValue(value, column, lang) {
  if (column.type === "number" && typeof value === "number") {
    return value.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(value ?? "");
}

function sumColumn(rows, key) {
  return rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
}

/**
 * @param {{ meta: object, sheets: object[], safeExportName: string, lang: "ar" | "en" }} payload
 */
export function exportProfessionalPdf(payload) {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;
  const direction = payload.lang === "ar" ? "rtl" : "ltr";
  const textAlign = payload.lang === "ar" ? "right" : "left";

  const sheetsHtml = payload.sheets.map((sheetDef) => {
    const headerHtml = sheetDef.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
    const rowsHtml = sheetDef.rows.map((row) => (
      `<tr>${sheetDef.columns.map((column) => `<td>${escapeHtml(formatCellValue(row[column.key], column, payload.lang))}</td>`).join("")}</tr>`
    )).join("");
    const sumColumns = sheetDef.columns.filter((column) => column.sum);
    const totalsHtml = sumColumns.length
      ? `<tr class="total-row">${sheetDef.columns.map((column, index) => {
        if (index === 0 && !column.sum) {
          return `<td>${payload.lang === "ar" ? "الإجمالي" : "Total"}</td>`;
        }
        if (!column.sum) return "<td></td>";
        return `<td>${escapeHtml(formatCellValue(sumColumn(sheetDef.rows, column.key), column, payload.lang))}</td>`;
      }).join("")}</tr>`
      : "";

    return `
      <section class="sheet-block">
        <h2>${escapeHtml(sheetDef.name)}</h2>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}${totalsHtml}</tbody>
        </table>
      </section>
    `;
  }).join("");

  printWindow.document.write(`<!doctype html>
<html dir="${direction}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(payload.safeExportName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #112A46; padding: 36px; background: #fff; }
    header { border-bottom: 3px solid #C28A30; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 24px; margin: 0 0 8px; font-weight: 800; }
    .meta { margin: 4px 0; color: #716753; font-size: 13px; }
    .sheet-block { margin-bottom: 28px; page-break-inside: avoid; }
    h2 { font-size: 16px; margin: 0 0 10px; color: #112A46; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #112A46; color: #fff; text-align: ${textAlign}; padding: 10px; }
    td { padding: 10px; border-bottom: 1px solid #E6DFD1; font-weight: 600; text-align: ${textAlign}; }
    tr.total-row td { font-weight: 800; border-top: 2px solid #C28A30; background: #FFF8E8; }
    footer { margin-top: 24px; color: #827762; font-size: 11px; }
    @media print { body { padding: 18px; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(payload.meta.title)}</h1>
    <p class="meta">${escapeHtml(payload.meta.storeLabel)}: ${escapeHtml(payload.meta.storeName)}</p>
    <p class="meta">${payload.lang === "ar" ? "الفترة" : "Period"}: ${escapeHtml(payload.meta.periodLabel)}</p>
    ${payload.meta.viewLabel ? `<p class="meta">${payload.lang === "ar" ? "العرض" : "View"}: ${escapeHtml(payload.meta.viewLabel)}</p>` : ""}
    <p class="meta">${payload.lang === "ar" ? "تاريخ التصدير" : "Exported at"}: ${escapeHtml(payload.meta.exportedAt)}</p>
  </header>
  ${sheetsHtml}
  <footer>${payload.lang === "ar" ? "تقفيلة — للاستخدام التشغيلي" : "Taqfeelah — operational export"}</footer>
  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`);
  printWindow.document.close();
}

import { downloadBlobFile } from "@/components/prototype-runtime/notebook-share-export-helpers";

const HEADER_FILL = "FF112A46";
const HEADER_FONT = "FFFFFFFF";
const NUMBER_FORMAT = "#,##0.00";

function columnLetter(index) {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function applyHeaderStyle(cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  cell.font = { bold: true, color: { argb: HEADER_FONT } };
  cell.alignment = { vertical: "middle", horizontal: "center" };
}

/**
 * @param {{ meta: object, sheets: object[], safeExportName: string, lang: "ar" | "en" }} payload
 */
export async function exportProfessionalExcel(payload) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Taqfeelah";
  workbook.created = new Date();

  payload.sheets.forEach((sheetDef) => {
    const worksheet = workbook.addWorksheet(sheetDef.name.slice(0, 31), {
      views: [{ rightToLeft: payload.lang === "ar" }],
    });

    worksheet.addRow([payload.meta.title]);
    worksheet.addRow([payload.meta.storeLabel, payload.meta.storeName]);
    worksheet.addRow([payload.lang === "ar" ? "الفترة" : "Period", payload.meta.periodLabel]);
    if (payload.meta.viewLabel) {
      worksheet.addRow([payload.lang === "ar" ? "العرض" : "View", payload.meta.viewLabel]);
    }
    worksheet.addRow([payload.lang === "ar" ? "تاريخ التصدير" : "Exported at", payload.meta.exportedAt]);
    worksheet.addRow([]);

    const headerRowIndex = worksheet.rowCount + 1;
    const headerRow = worksheet.addRow(sheetDef.columns.map((column) => column.label));
    headerRow.eachCell((cell) => applyHeaderStyle(cell));

    sheetDef.rows.forEach((row) => {
      const values = sheetDef.columns.map((column) => {
        const value = row[column.key];
        if (column.type === "number") return typeof value === "number" ? value : Number(value) || 0;
        return value ?? "";
      });
      const added = worksheet.addRow(values);
      sheetDef.columns.forEach((column, index) => {
        if (column.type === "number") {
          added.getCell(index + 1).numFmt = NUMBER_FORMAT;
        }
      });
    });

    const sumColumns = sheetDef.columns
      .map((column, index) => (column.sum ? index : -1))
      .filter((index) => index >= 0);
    if (sumColumns.length && sheetDef.rows.length) {
      const dataStart = headerRowIndex + 1;
      const dataEnd = worksheet.rowCount;
      const totalLabel = payload.lang === "ar" ? "الإجمالي" : "Total";
      const totalRowValues = sheetDef.columns.map((column, index) => {
        if (index === 0) return totalLabel;
        if (!column.sum) return "";
        const letter = columnLetter(index);
        return { formula: `SUM(${letter}${dataStart}:${letter}${dataEnd})` };
      });
      const totalRow = worksheet.addRow(totalRowValues);
      sumColumns.forEach((index) => {
        totalRow.getCell(index + 1).numFmt = NUMBER_FORMAT;
        totalRow.getCell(index + 1).font = { bold: true };
      });
    }

    sheetDef.columns.forEach((column, index) => {
      const widths = sheetDef.rows.map((row) => String(row[column.key] ?? "").length);
      const headerWidth = column.label.length;
      worksheet.getColumn(index + 1).width = Math.min(42, Math.max(headerWidth, ...widths, 12) + 2);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlobFile(blob, `${payload.safeExportName}.xlsx`);
}

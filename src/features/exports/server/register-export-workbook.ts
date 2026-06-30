import ExcelJS from "exceljs";
import type { getNotebookExport } from "@/features/exports/server/get-notebook-export";
import { EXPORT_JOB_MIME_XLSX } from "@/features/exports/server/export-job-storage";

type NotebookExportPayload = Awaited<ReturnType<typeof getNotebookExport>>;

function fitColumns(sheet: ExcelJS.Worksheet) {
  sheet.columns?.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = String(cell.value ?? "");
      maxLength = Math.max(maxLength, Math.min(value.length + 2, 42));
    });
    column.width = maxLength;
  });
}

export async function buildRegisterOperationsExcelBuffer(payload: NotebookExportPayload) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Taqfeelah";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" },
  ];
  summary.addRows([
    { metric: "Store", value: payload.storeId },
    { metric: "Period", value: `${payload.from} - ${payload.to}` },
    { metric: "Sales", value: payload.totals.sales },
    { metric: "Outflow", value: payload.totals.expense },
    { metric: "Net", value: payload.totals.net },
    { metric: "Outflow ratio", value: payload.totals.ratio },
    { metric: "Proofs", value: payload.totals.proofs },
    { metric: "Operations", value: payload.operations.length },
  ]);
  fitColumns(summary);

  const channels = workbook.addWorksheet("Channels");
  channels.columns = [
    { header: "Channel", key: "name" },
    { header: "Amount", key: "amount" },
  ];
  channels.addRows(payload.channels.map((channel) => ({
    name: channel.name,
    amount: channel.amount,
  })));
  fitColumns(channels);

  const operations = workbook.addWorksheet("Operations");
  operations.columns = [
    { header: "Date", key: "date" },
    { header: "Type", key: "type" },
    { header: "Amount", key: "amount" },
    { header: "Note", key: "note" },
    { header: "Has attachment", key: "hasAttachment" },
    { header: "Created at", key: "createdAt" },
    { header: "Entry ID", key: "id" },
  ];
  operations.addRows(payload.operations.map((operation) => ({
    date: operation.date,
    type: operation.type,
    amount: operation.amount,
    note: operation.note,
    hasAttachment: operation.hasAttachment ? "Yes" : "No",
    createdAt: operation.createdAt,
    id: operation.id,
  })));
  operations.getRow(1).font = { bold: true };
  fitColumns(operations);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: EXPORT_JOB_MIME_XLSX,
  };
}

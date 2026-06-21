import { countCloseoutAttachments } from "@/features/closeouts/client/closeout-attachment-utils";
import { formatDisplayMoneyFromRiyals } from "@/core/money/format-display-money";
import { formatNumericDate } from "@/features/reports/client/report-period-labels";
import { closeoutStatusLabel } from "./closeout-status";
import { computeCloseoutTotals, salesArrayFromRecord } from "./closeout-calculations";
import type { CloseoutOutflow, CloseoutSyncLang, DailyCloseoutRecord } from "./daily-closeouts-types";

function money(value: number | string | null | undefined): string {
  return formatDisplayMoneyFromRiyals(Number(value || 0), "en");
}

function formatShareDate(isoDate: string): string {
  return formatNumericDate(isoDate);
}

function outflowLineLabel(item: CloseoutOutflow, lang: CloseoutSyncLang): string {
  const typeMap: Record<string, string> = {
    purchases: lang === "ar" ? "مشتريات" : "Purchases",
    expense: lang === "ar" ? "مصروف" : "Expense",
    withdrawal: lang === "ar" ? "سحب" : "Withdrawal",
  };
  const type = typeMap[String(item.type)] || String(item.type || "");
  const category = item.category || item.note;
  return category ? `${type} · ${category}` : type;
}

export async function createCloseoutShareImage(
  closeout: DailyCloseoutRecord,
  options: { lang?: CloseoutSyncLang; storeName?: string } = {},
): Promise<Blob> {
  const lang = options.lang || "ar";
  const storeName = options.storeName || closeout.storeName || "";
  const salesRows = salesArrayFromRecord(closeout.sales);
  const totals = closeout.totals || computeCloseoutTotals(closeout.sales, closeout.outflows);
  const outflows = closeout.outflows || [];
  const attachmentCount = countCloseoutAttachments(closeout.attachments);
  const statusText = closeoutStatusLabel(closeout.status, lang, {
    autoRecorded: !closeout.reviewedByName && closeout.status === "reviewed",
  });

  const width = 1080;
  const lineStep = 42;
  const summaryRows = 4;
  const salesRowsCount = Math.max(salesRows.length, 1);
  const outRowsCount = Math.max(outflows.length, 1);
  const receiptRows = attachmentCount ? 1 : 0;
  const topMargin = 122;
  const totalLines = 3 + 2 + 1 + summaryRows + 1 + salesRowsCount + 1 + outRowsCount + receiptRows + 2;
  const height = topMargin + totalLines * lineStep + 80;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  const drawingCtx: CanvasRenderingContext2D = ctx;

  const navy = "#112A46";
  const gold = "#D69C2F";
  const paper = "#FBF7ED";
  const line = "rgba(105,135,154,.10)";
  const redLine = "rgba(211,91,83,.38)";
  const red = "#BA4742";
  const green = "#26784C";
  const muted = "#7D715C";
  const labelX = width - 180;
  const valueX = 300;

  drawingCtx.fillStyle = paper;
  drawingCtx.fillRect(0, 0, width, height);

  drawingCtx.strokeStyle = line;
  drawingCtx.lineWidth = 1;
  for (let y = topMargin; y < height; y += lineStep) {
    drawingCtx.beginPath();
    drawingCtx.moveTo(66, y);
    drawingCtx.lineTo(width - 66, y);
    drawingCtx.stroke();
  }

  drawingCtx.strokeStyle = redLine;
  drawingCtx.lineWidth = 2;
  drawingCtx.beginPath();
  drawingCtx.moveTo(width - 100, 0);
  drawingCtx.lineTo(width - 100, height);
  drawingCtx.stroke();

  function tx(
    value: string,
    x: number,
    yPos: number,
    size: number,
    weight: string | number,
    color: string,
    align: CanvasTextAlign = "right",
  ): void {
    drawingCtx.save();
    drawingCtx.direction = "rtl";
    drawingCtx.textAlign = align;
    drawingCtx.textBaseline = "alphabetic";
    drawingCtx.fillStyle = color;
    drawingCtx.font = `${weight} ${size}px Tahoma, Arial, sans-serif`;
    drawingCtx.fillText(value, x, yPos);
    drawingCtx.restore();
  }

  function underlineCentered(cx: number, yPos: number, w = 84): void {
    drawingCtx.fillStyle = gold;
    drawingCtx.fillRect(cx - w / 2, yPos, w, 2);
  }

  let y = 72;
  tx("تقفيلة", width / 2, y, 58, "800", navy, "center");
  y += 28;
  tx("TAQFEELAH", width / 2, y, 16, "800", gold, "center");
  y += 48;
  tx(lang === "ar" ? "ملخص التقفيلة اليومية" : "Daily closeout summary", width / 2, y, 40, "800", navy, "center");
  underlineCentered(width / 2, y + 12, 174);

  y = topMargin + lineStep * 1.25;
  tx(storeName, labelX, y, 32, "700", navy);
  tx(formatShareDate(closeout.date || ""), valueX, y, 25, "700", muted, "left");

  y += lineStep * 1.4;
  tx(lang === "ar" ? "ملخص اليوم" : "Day summary", width / 2, y, 30, "800", navy, "center");
  underlineCentered(width / 2, y + 8, 96);

  const summary: Array<[string, string, string]> = [
    [lang === "ar" ? "إجمالي الداخل" : "Total in", `${money(totals.totalSales)} ر.س`, navy],
    [lang === "ar" ? "إجمالي الخارج" : "Total out", `${money(totals.totalOutflow)} ر.س`, red],
    [lang === "ar" ? "الناتج" : "Net", `${money(totals.netMovement)} ر.س`, green],
    [lang === "ar" ? "الحالة" : "Status", statusText, closeout.status === "reviewed" ? green : gold],
  ];
  summary.forEach((row) => {
    y += lineStep;
    tx(row[0], labelX, y, 29, "700", muted);
    tx(row[1], valueX, y, 33, "800", row[2], "left");
  });

  y += lineStep * 1.2;
  tx(lang === "ar" ? "تفاصيل الداخل" : "Sales details", width / 2, y, 30, "800", navy, "center");
  underlineCentered(width / 2, y + 8, 108);

  if (salesRows.length) {
    salesRows.forEach((row) => {
      y += lineStep;
      tx(String(row.name || ""), labelX, y, 26, "700", navy);
      tx(`${money(row.amount)} ر.س`, valueX, y, 26, "800", navy, "left");
    });
  } else {
    y += lineStep;
    tx(lang === "ar" ? "لا يوجد داخل" : "No sales", labelX, y, 24, "700", muted);
    tx("0 ر.س", valueX, y, 26, "800", navy, "left");
  }

  y += lineStep * 1.2;
  tx(lang === "ar" ? "تفاصيل الخارج" : "Outflow details", width / 2, y, 30, "800", navy, "center");
  underlineCentered(width / 2, y + 8, 108);

  if (outflows.length) {
    outflows.forEach((item) => {
      y += lineStep;
      tx(outflowLineLabel(item, lang), labelX, y, 24, "700", navy);
      tx(`-${money(item.amount)} ر.س`, valueX, y, 26, "800", red, "left");
    });
  } else {
    y += lineStep;
    tx(lang === "ar" ? "لا يوجد خارج" : "No outflows", labelX, y, 24, "700", muted);
    tx("0 ر.س", valueX, y, 26, "800", red, "left");
  }

  if (attachmentCount) {
    y += lineStep * 1.2;
    tx(lang === "ar" ? "صور الإثبات" : "Proof photos", labelX, y, 24, "700", muted);
    tx(String(attachmentCount), valueX, y, 26, "800", navy, "left");
  }

  tx(lang === "ar" ? "تم إنشاؤها عبر تطبيق تقفيلة" : "Created with Taqfeelah", width / 2, height - 28, 20, "700", muted, "center");
  drawingCtx.fillStyle = gold;
  drawingCtx.fillRect(width / 2 - 50, height - 46, 100, 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Failed to create image"));
      else resolve(blob);
    }, "image/png", 1);
  });
}

import { readLocalStorageJson } from "../demo/prototype-storage";
import { computeCloseoutTotals } from "./closeout-calculations";
import { CLOSEOUT_STATUS } from "./closeout-status";

export const DAILY_CLOSEOUTS_STORAGE_KEY = "taqfeelah_daily_closeouts_v1";
export const CLOSEOUT_EVENTS_STORAGE_KEY = "taqfeelah_closeout_events_v1";

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function readDailyCloseouts() {
  if (typeof window === "undefined") return [];
  const parsed = readLocalStorageJson(DAILY_CLOSEOUTS_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeDailyCloseouts(closeouts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_CLOSEOUTS_STORAGE_KEY, JSON.stringify(closeouts));
}

export function readCloseoutEvents() {
  if (typeof window === "undefined") return [];
  const parsed = readLocalStorageJson(CLOSEOUT_EVENTS_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCloseoutEvents(events) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function appendCloseoutEvent(events, payload) {
  const next = [{ id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), ...payload }, ...events];
  writeCloseoutEvents(next);
  return next;
}

export function withCloseoutTotals(closeout) {
  const totals = computeCloseoutTotals(closeout.sales, closeout.outflows);
  return { ...closeout, totals };
}

export function createDraftCloseout({ storeId, storeName, date, employee, notebookTheme = "yellow" }) {
  const id = `dc-${Date.now()}`;
  return withCloseoutTotals({
    id,
    storeId,
    storeName,
    date,
    openedByUserId: employee.id,
    openedByName: employee.nameAr,
    submittedByUserId: null,
    submittedByName: null,
    status: CLOSEOUT_STATUS.DRAFT,
    notebookTheme,
    sales: {},
    outflows: [],
    attachments: [],
    totals: { totalSales: 0, totalOutflow: 0, netMovement: 0 },
    submittedAt: null,
    reviewedAt: null,
    reviewedByName: null,
    returnedAt: null,
    returnedByName: null,
    returnReason: null,
  });
}

export function findCloseoutForStoreDate(closeouts, storeId, date) {
  return closeouts.find((item) => item.storeId === storeId && item.date === date) || null;
}

export function sortCloseoutsNewestFirst(closeouts) {
  return [...closeouts].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const aTime = a.submittedAt || a.openedAt || "";
    const bTime = b.submittedAt || b.openedAt || "";
    return aTime < bTime ? 1 : -1;
  });
}

export function pendingSubmittedCloseouts(closeouts, storeIds = null) {
  return closeouts.filter((item) => {
    if (item.status !== CLOSEOUT_STATUS.SUBMITTED) return false;
    if (!storeIds) return true;
    return storeIds.includes(item.storeId);
  });
}

export function closeoutEventMessage(event, lang = "ar") {
  const name = event.actorName || (lang === "ar" ? "مستخدم" : "User");
  const store = event.storeName || "";
  const dateLabel = event.dateLabel || event.date || "";
  const ar = {
    opened: `${name} فتح تقفيلة يوم ${dateLabel} — ${store}`,
    submitted: `${name} أرسل تقفيلة يوم ${dateLabel} — ${store}`,
    approved: `${lang === "ar" ? "المالك اعتمد" : "Owner approved"} تقفيلة يوم ${dateLabel} ${lang === "ar" ? "المرسلة من" : "from"} ${event.employeeName || name}`,
    returned: `${lang === "ar" ? "المالك" : "Owner"} أعاد تقفيلة يوم ${dateLabel} للتعديل`,
    resubmitted: `${name} أعاد إرسال تقفيلة يوم ${dateLabel} — ${store}`,
  };
  const en = {
    opened: `${name} opened closeout for ${dateLabel} — ${store}`,
    submitted: `${name} submitted closeout for ${dateLabel} — ${store}`,
    approved: `Owner approved closeout for ${dateLabel} from ${event.employeeName || name}`,
    returned: `Owner returned closeout for ${dateLabel} for edits`,
    resubmitted: `${name} resubmitted closeout for ${dateLabel} — ${store}`,
  };
  return (lang === "ar" ? ar : en)[event.type] || event.message || "";
}

export function buildOperationalEntriesFromCloseout(closeout, actor) {
  const entries = [];
  const baseId = closeout.id;
  const salesRows = Array.isArray(closeout.sales)
    ? closeout.sales
    : Object.values(closeout.sales || {});
  const salesChannels = salesRows
    .filter((row) => Number(row.amount) > 0)
    .map((row) => ({
      channelId: row.channelId || row.id,
      name: row.name,
      amount: Number(row.amount),
    }));
  const salesTotal = salesChannels.reduce((sum, row) => sum + row.amount, 0);
  if (salesTotal > 0) {
    entries.push({
      payload: {
        businessId: closeout.storeId,
        date: closeout.date,
        type: "summary",
        salesChannels,
        noteKey: "salesSummary",
        closeoutId: closeout.id,
      },
      kind: "summary",
    });
  }
  (closeout.outflows || []).forEach((row, index) => {
    entries.push({
      payload: {
        businessId: closeout.storeId,
        date: closeout.date,
        type: row.type,
        categoryId: row.categoryId || null,
        amount: row.amount,
        note: row.note || "",
        noteKey: row.noteKey || null,
        closeoutId: closeout.id,
        outflowId: row.id || `${baseId}-out-${index}`,
      },
      kind: "outflow",
      attachment: row.attachments?.[0] || null,
    });
  });
  if ((closeout.attachments || []).length && entries.length && entries[0].kind === "summary") {
    const dataUrl = closeout.attachments[0];
    entries[0].payload.attachment = typeof dataUrl === "string"
      ? { id: `attachment-${baseId}`, kind: "image", name: "closeout-proof.jpg", mimeType: "image/jpeg", dataUrl }
      : dataUrl;
  }
  return { entries, actor };
}

export { todayIsoDate };

import { readLocalStorageJson, safeSetLocalStorageItem } from "@/core/client/safe-local-storage";
import { storeIdsReferToSameStore } from "../employee-closeouts/employee-closeout-history";
import { computeCloseoutTotals } from "./closeout-calculations";
import { normalizeCloseoutSalesToArray } from "./closeout-sales-normalize";
import { CLOSEOUT_STATUS } from "./closeout-status";
import type {
  CloseoutEvent,
  CloseoutOutflow,
  CloseoutSalesChannelRow,
  CloseoutSyncLang,
  CloseoutWorkflowFailure,
  DailyCloseoutRecord,
  CloseoutOperationalActor,
  EmployeeActorRef,
  NotebookThemeId,
  StorageWriteResult,
} from "./daily-closeouts-types";
import type { OperationalEntryAttachment } from "@/features/entries/client/entries-client-types";

export const DAILY_CLOSEOUTS_STORAGE_KEY = "taqfeelah_daily_closeouts_v1";
export const CLOSEOUT_EVENTS_STORAGE_KEY = "taqfeelah_closeout_events_v1";

type CloseoutWorkflowHints = {
  submittedAt?: string | null;
  reviewedAt?: string | null;
  returnedAt?: string | null;
  returnReason?: string | null;
  ownerEditedAt?: string | null;
  ownerEditedByName?: string | null;
};

type CloseoutOperationalEntryPayload = {
  businessId: string;
  date: string;
  type: string;
  salesChannels?: Array<{ channelId?: string; name?: string; amount: number }>;
  noteKey?: string | null;
  closeoutId: string;
  categoryId?: string | null;
  amount?: number;
  note?: string;
  outflowId?: string;
  attachment?: OperationalEntryAttachment;
};

type CloseoutOperationalEntryDraft = {
  payload: CloseoutOperationalEntryPayload;
  kind: "summary" | "outflow";
  attachment?: OperationalEntryAttachment | null;
};

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function readDailyCloseouts(): DailyCloseoutRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = readLocalStorageJson(DAILY_CLOSEOUTS_STORAGE_KEY, []) as DailyCloseoutRecord[];
  if (!Array.isArray(parsed)) return [];
  const parsedEvents = readLocalStorageJson(CLOSEOUT_EVENTS_STORAGE_KEY, []) as CloseoutEvent[];
  const workflowHints = buildCloseoutWorkflowHints(Array.isArray(parsedEvents) ? parsedEvents : []);
  return parsed.map((item) => withCloseoutTotals(applyWorkflowHints(item, workflowHints.get(item?.id || ""))));
}

export function writeDailyCloseouts(closeouts: DailyCloseoutRecord[]): StorageWriteResult {
  if (typeof window === "undefined") return { ok: true };
  return safeSetLocalStorageItem(DAILY_CLOSEOUTS_STORAGE_KEY, JSON.stringify(closeouts));
}

/** Failed submit/owner-edit result from DailyCloseoutsProvider ({ ok: false, phase }). */
export function isCloseoutWorkflowFailure(result: unknown): result is CloseoutWorkflowFailure {
  return Boolean(
    result
    && typeof result === "object"
    && (result as CloseoutWorkflowFailure).ok === false
    && ((result as CloseoutWorkflowFailure).phase === "save" || (result as CloseoutWorkflowFailure).phase === "send"),
  );
}

/** Client-only draft closeouts never exist on the server until submit succeeds. */
export function isLocalDraftCloseout(closeout: DailyCloseoutRecord | null | undefined): boolean {
  if (!closeout || typeof closeout !== "object") return false;
  return closeout.status === CLOSEOUT_STATUS.DRAFT && !closeout.submittedAt;
}

export function readCloseoutEvents(): CloseoutEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = readLocalStorageJson(CLOSEOUT_EVENTS_STORAGE_KEY, []) as CloseoutEvent[];
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCloseoutEvents(events: CloseoutEvent[]): void {
  if (typeof window === "undefined") return;
  safeSetLocalStorageItem(CLOSEOUT_EVENTS_STORAGE_KEY, JSON.stringify(events), {
    scope: "local-closeout-events",
  });
}

export function appendCloseoutEvent(events: CloseoutEvent[], payload: Omit<CloseoutEvent, "id" | "at">): CloseoutEvent[] {
  const next: CloseoutEvent[] = [{
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...payload,
  }, ...events];
  writeCloseoutEvents(next);
  return next;
}

export function withCloseoutTotals(closeout: DailyCloseoutRecord | null | undefined): DailyCloseoutRecord {
  const normalized = normalizeCloseout(closeout);
  const totals = computeCloseoutTotals(normalized.sales, normalized.outflows);
  return { ...normalized, totals };
}

function normalizeCloseoutStatus(closeout: DailyCloseoutRecord | null | undefined): string {
  if (!closeout || typeof closeout !== "object") return CLOSEOUT_STATUS.DRAFT;
  const raw = closeout.status;
  const hasReturned = Boolean(closeout.returnedAt || closeout.returnedByName || closeout.returnReason);
  const hasReviewed = Boolean(closeout.reviewedAt || closeout.reviewedByName);
  const hasSubmitted = Boolean(closeout.submittedAt || closeout.submittedByUserId || closeout.submittedByName);
  const hasSyncedToOperationalEntries = closeout.syncedToEntries === true;
  if (raw === CLOSEOUT_STATUS.RETURNED || hasReturned) return CLOSEOUT_STATUS.REVIEWED;
  if (raw === CLOSEOUT_STATUS.REVIEWED || hasReviewed || hasSyncedToOperationalEntries) return CLOSEOUT_STATUS.REVIEWED;
  if (raw === CLOSEOUT_STATUS.SUBMITTED || hasSubmitted) return CLOSEOUT_STATUS.REVIEWED;
  return CLOSEOUT_STATUS.DRAFT;
}

function buildCloseoutWorkflowHints(events: CloseoutEvent[]): Map<string, CloseoutWorkflowHints> {
  const hintsByCloseoutId = new Map<string, CloseoutWorkflowHints>();
  events.forEach((event) => {
    if (!event || typeof event.closeoutId !== "string" || !event.closeoutId) return;
    const hint = hintsByCloseoutId.get(event.closeoutId) || {};
    const at = typeof event.at === "string" && event.at ? event.at : null;
    if (event.type === "submitted" || event.type === "resubmitted" || event.type === "ownerEdit") {
      if (!hint.submittedAt || (at && at > hint.submittedAt)) hint.submittedAt = at;
    }
    if (event.type === "resubmitted" || event.type === "ownerEdit") {
      if (!hint.ownerEditedAt || (at && at > hint.ownerEditedAt)) {
        hint.ownerEditedAt = at;
        hint.ownerEditedByName = event.actorName || event.employeeName || null;
      }
    }
    if (event.type === "approved") {
      if (!hint.reviewedAt || (at && at > hint.reviewedAt)) hint.reviewedAt = at;
    }
    if (event.type === "returned") {
      if (!hint.returnedAt || (at && at > hint.returnedAt)) hint.returnedAt = at;
      if (typeof event.reason === "string" && event.reason.trim() && !hint.returnReason) {
        hint.returnReason = event.reason.trim();
      }
    }
    hintsByCloseoutId.set(event.closeoutId, hint);
  });
  return hintsByCloseoutId;
}

function applyWorkflowHints(
  closeout: DailyCloseoutRecord,
  hints: CloseoutWorkflowHints | undefined,
): DailyCloseoutRecord {
  if (!closeout || typeof closeout !== "object" || !hints) return closeout;
  return {
    ...closeout,
    submittedAt: closeout.submittedAt || hints.submittedAt || null,
    reviewedAt: closeout.reviewedAt || hints.reviewedAt || null,
    returnedAt: closeout.returnedAt || hints.returnedAt || null,
    returnReason: closeout.returnReason || hints.returnReason || null,
    ownerEditedAt: closeout.ownerEditedAt || hints.ownerEditedAt || null,
    ownerEditedByName: closeout.ownerEditedByName || hints.ownerEditedByName || null,
  };
}

function normalizeCloseout(closeout: DailyCloseoutRecord | null | undefined): DailyCloseoutRecord {
  if (!closeout || typeof closeout !== "object") {
    return {
      id: "",
      storeId: "",
      date: "",
      sales: [],
      outflows: [],
      attachments: [],
      status: CLOSEOUT_STATUS.DRAFT,
    };
  }
  return {
    ...closeout,
    sales: normalizeCloseoutSalesToArray(closeout.sales),
    outflows: Array.isArray(closeout.outflows) ? closeout.outflows : [],
    attachments: Array.isArray(closeout.attachments) ? closeout.attachments.filter(Boolean) : [],
    status: normalizeCloseoutStatus(closeout),
  };
}

export function createDraftCloseout({
  storeId,
  storeName,
  date,
  employee,
  notebookTheme = "yellow",
}: {
  storeId: string;
  storeName?: string;
  date: string;
  employee: EmployeeActorRef;
  notebookTheme?: NotebookThemeId | string;
}): DailyCloseoutRecord {
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

export function findCloseoutsForStoreDate(
  closeouts: DailyCloseoutRecord[],
  storeId: string,
  date: string,
): DailyCloseoutRecord[] {
  return (Array.isArray(closeouts) ? closeouts : []).filter(
    (item) => item.date === date && (
      item.storeId === storeId || storeIdsReferToSameStore(item.storeId, storeId)
    ),
  );
}

export function findCloseoutForStoreDate(
  closeouts: DailyCloseoutRecord[],
  storeId: string,
  date: string,
): DailyCloseoutRecord | null {
  const matches = findCloseoutsForStoreDate(closeouts, storeId, date);
  if (!matches.length) return null;
  const draft = matches.find(
    (item) => item.status === CLOSEOUT_STATUS.DRAFT && !item.submittedAt,
  );
  if (draft) return draft;
  return [...matches].sort((a, b) => {
    const aTime = a.submittedAt || a.openedAt || "";
    const bTime = b.submittedAt || b.openedAt || "";
    return aTime < bTime ? 1 : -1;
  })[0];
}

export function sortCloseoutsNewestFirst(closeouts: DailyCloseoutRecord[]): DailyCloseoutRecord[] {
  return [...closeouts].sort((a, b) => {
    const aDate = a.date || "";
    const bDate = b.date || "";
    if (aDate !== bDate) return aDate < bDate ? 1 : -1;
    const aTime = a.submittedAt || a.openedAt || "";
    const bTime = b.submittedAt || b.openedAt || "";
    return aTime < bTime ? 1 : -1;
  });
}

/** Owner review queue is retired; keep a stable empty adapter for old callers. */
export function pendingOwnerCloseoutQueue(): DailyCloseoutRecord[] {
  return [];
}

/** Local boot hook — returns local closeouts unchanged (no owner approval queue). */
export function loadLocalCloseoutsOnBoot(): DailyCloseoutRecord[] {
  return readDailyCloseouts();
}

/** Local timeline labels. `approved` / `returned` are legacy event types from removed owner-review flow. */
export function closeoutEventMessage(event: CloseoutEvent, lang: CloseoutSyncLang = "ar"): string {
  const name = event.actorName || (lang === "ar" ? "مستخدم" : "User");
  const store = event.storeName || "";
  const dateLabel = event.dateLabel || event.date || "";
  const ar: Record<string, string> = {
    opened: `${name} فتح تقفيلة يوم ${dateLabel} — ${store}`,
    submitted: `${name} أرسل تقفيلة يوم ${dateLabel} — ${store}`,
    approved: `${lang === "ar" ? "المالك اعتمد" : "Owner approved"} تقفيلة يوم ${dateLabel} ${lang === "ar" ? "المرسلة من" : "from"} ${event.employeeName || name}`,
    returned: `${lang === "ar" ? "المالك" : "Owner"} أعاد تقفيلة يوم ${dateLabel} للتعديل`,
    resubmitted: `${name} أعاد إرسال تقفيلة يوم ${dateLabel} — ${store}`,
    ownerEdit: `${name} أعاد إرسال تقفيلة يوم ${dateLabel} — ${store}`,
  };
  const en: Record<string, string> = {
    opened: `${name} opened closeout for ${dateLabel} — ${store}`,
    submitted: `${name} submitted closeout for ${dateLabel} — ${store}`,
    approved: `Owner approved closeout for ${dateLabel} from ${event.employeeName || name}`,
    returned: `Owner returned closeout for ${dateLabel} for edits`,
    resubmitted: `${name} resubmitted closeout for ${dateLabel} — ${store}`,
    ownerEdit: `${name} resubmitted closeout for ${dateLabel} — ${store}`,
  };
  const map = lang === "ar" ? ar : en;
  return map[String(event.type)] || event.message || "";
}

export function buildOperationalEntriesFromCloseout(
  closeout: DailyCloseoutRecord,
  actor: CloseoutOperationalActor,
): { entries: CloseoutOperationalEntryDraft[]; actor: CloseoutOperationalActor } {
  const entries: CloseoutOperationalEntryDraft[] = [];
  const baseId = closeout.id;
  const salesRows: CloseoutSalesChannelRow[] = Array.isArray(closeout.sales)
    ? closeout.sales
    : Object.values(closeout.sales || {}) as CloseoutSalesChannelRow[];
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
        businessId: closeout.storeId || "",
        date: closeout.date || "",
        type: "summary",
        salesChannels,
        noteKey: "salesSummary",
        closeoutId: closeout.id || "",
      },
      kind: "summary",
    });
  }
  (closeout.outflows || []).forEach((row: CloseoutOutflow, index: number) => {
    entries.push({
      payload: {
        businessId: closeout.storeId || "",
        date: closeout.date || "",
        type: String(row.type),
        categoryId: row.categoryId || null,
        amount: Number(row.amount),
        note: row.note || "",
        noteKey: row.noteKey || null,
        closeoutId: closeout.id || "",
        outflowId: row.id || `${baseId}-out-${index}`,
      },
      kind: "outflow",
      attachment: (row.attachments?.[0] as OperationalEntryAttachment | undefined) || null,
    });
  });
  if ((closeout.attachments || []).length && entries.length && entries[0].kind === "summary") {
    const firstAttachment = closeout.attachments?.[0];
    if (typeof firstAttachment === "string") {
      entries[0].payload.attachment = {
        id: `attachment-${baseId}`,
        kind: "image",
        name: "closeout-proof.jpg",
        mimeType: "image/jpeg",
        dataUrl: firstAttachment,
      };
    } else if (firstAttachment && typeof firstAttachment === "object" && firstAttachment.dataUrl) {
      entries[0].payload.attachment = firstAttachment;
    }
  }
  return { entries, actor };
}

export { todayIsoDate };

import { computeCloseoutTotals } from "@/features/operations/operational-analytics";
import { CLOSEOUT_STATUS } from "../daily-closeouts/closeout-status";
import { buildOperationalEntriesFromCloseout, withCloseoutTotals } from "../daily-closeouts/daily-closeouts-demo-store";

export const PROTOTYPE_DEMO_DATASET_VERSION = "2026-05-month-v1";
export const PROTOTYPE_DEMO_DATASET_VERSION_KEY = "taqfeelah_demo_dataset_version";
export const PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY = "taqfeelah_operational_entries_v4_month_demo";
export const PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY = "taqfeelah_last_closeout_dates_v4_month_demo";

export const DEMO_ACTORS = {
  owner: { role: "owner", userId: "owner", nameAr: "محمد الهاجري", nameEn: "Mohammad Alhajri" },
  ahmed: { role: "employee", userId: "ahmed", nameAr: "أحمد", nameEn: "Ahmed" },
  sara: { role: "employee", userId: "sara", nameAr: "سارة", nameEn: "Sara" },
};

export const DEMO_STORES = [
  { id: "shami", nameAr: "مشويات المعلم الشامي", nameEn: "Al-Shami Grill", employeeId: "ahmed" },
  { id: "arz", nameAr: "لاونج ARZ", nameEn: "ARZ Lounge", employeeId: "sara" },
];

export const DEMO_CHANNELS = [
  { id: "cash", nameAr: "نقدي", nameEn: "Cash" },
  { id: "mada", nameAr: "مدى", nameEn: "Mada" },
  { id: "apple", nameAr: "Apple Pay", nameEn: "Apple Pay" },
  { id: "jahez", nameAr: "جاهز", nameEn: "Jahez" },
  { id: "hunger", nameAr: "هنقرستيشن", nameEn: "Hungerstation" },
];

const EXPENSE_CATEGORIES = ["utility", "rent", "salary", "other"];
const DEMO_MONTH = "2026-05";
const JUNE_EXTRA_DAYS = ["2026-06-01", "2026-06-02"];

function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededInt(key, min, max) {
  const span = max - min + 1;
  return min + (hashSeed(key) % span);
}

function isoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function entryCreatedAt(iso, hour, minute = 0) {
  const stamp = new Date(`${iso}T12:00:00`);
  stamp.setHours(hour, minute, 0, 0);
  return stamp.toISOString();
}

function demoAttachment(id) {
  return { id, kind: "image", name: "receipt.jpg", mimeType: "image/jpeg", sizeBytes: 18400 };
}

function storeEmployee(store) {
  return store.employeeId === "sara" ? DEMO_ACTORS.sara : DEMO_ACTORS.ahmed;
}

function buildSalesRecord(storeId, date) {
  const record = {};
  const scale = storeId === "shami" ? 1 : 0.72;
  const fridayBoost = new Date(`${date}T12:00:00`).getDay() === 5 ? 1.18 : 1;
  DEMO_CHANNELS.forEach((channel) => {
    const raw = seededInt(`${storeId}|${date}|${channel.id}`, 40, 920);
    const amount = Math.round(raw * scale * fridayBoost);
    if (amount >= 90 || channel.id === "cash" || channel.id === "mada") {
      record[channel.id] = { channelId: channel.id, name: channel.nameAr, amount };
    }
  });
  if (!record.cash) {
    record.cash = { channelId: "cash", name: "نقدي", amount: seededInt(`${storeId}|${date}|cash-fallback`, 180, 900) };
  }
  if (!record.mada) {
    record.mada = { channelId: "mada", name: "مدى", amount: seededInt(`${storeId}|${date}|mada-fallback`, 220, 1100) };
  }
  return record;
}

function buildOutflows(storeId, date) {
  const count = seededInt(`${storeId}|${date}|out-n`, 0, 2);
  const types = ["purchases", "expense", "withdrawal"];
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const type = types[seededInt(`${storeId}|${date}|out-t|${i}`, 0, types.length - 1)];
    rows.push({
      id: `out-${storeId}-${date}-${i}`,
      type,
      categoryId: type === "expense" ? EXPENSE_CATEGORIES[seededInt(`${storeId}|${date}|out-c|${i}`, 0, EXPENSE_CATEGORIES.length - 1)] : null,
      amount: seededInt(`${storeId}|${date}|out-a|${i}`, 85, type === "withdrawal" ? 800 : 1400),
      note: "",
      noteKey: null,
      attachments: [],
    });
  }
  return rows;
}

function closeoutStatusFor(storeId, date) {
  if (date === "2026-06-02" && storeId === "shami") return CLOSEOUT_STATUS.DRAFT;
  if (date === "2026-06-02" && storeId === "arz") return CLOSEOUT_STATUS.SUBMITTED;
  if (date === "2026-05-12" && storeId === "arz") return CLOSEOUT_STATUS.RETURNED;
  if (storeId === "shami" && ["2026-05-28", "2026-05-29", "2026-05-30"].includes(date)) return CLOSEOUT_STATUS.SUBMITTED;
  if (date >= "2026-06-01") return CLOSEOUT_STATUS.REVIEWED;
  return CLOSEOUT_STATUS.REVIEWED;
}

function buildCloseout(store, date) {
  const employee = storeEmployee(store);
  const status = closeoutStatusFor(store.id, date);
  const sales = buildSalesRecord(store.id, date);
  const outflows = buildOutflows(store.id, date);
  const totals = computeCloseoutTotals(sales, outflows);
  const submitted = status !== CLOSEOUT_STATUS.DRAFT;
  const reviewed = status === CLOSEOUT_STATUS.REVIEWED;
  const returned = status === CLOSEOUT_STATUS.RETURNED;
  const submittedAt = submitted ? entryCreatedAt(date, 22, 15) : null;
  return withCloseoutTotals({
    id: `dc-${store.id}-${date}`,
    storeId: store.id,
    storeName: store.nameAr,
    date,
    openedByUserId: employee.userId,
    openedByName: employee.nameAr,
    submittedByUserId: submitted ? employee.userId : null,
    submittedByName: submitted ? employee.nameAr : null,
    status,
    sales,
    outflows,
    attachments: [],
    totals,
    submittedAt,
    reviewedAt: reviewed ? entryCreatedAt(date, 23, 5) : null,
    reviewedByName: reviewed ? DEMO_ACTORS.owner.nameAr : null,
    returnedAt: returned ? entryCreatedAt(date, 10, 30) : null,
    returnedByName: returned ? DEMO_ACTORS.owner.nameAr : null,
    returnReason: returned ? "يرجى مراجعة مبالغ الخارج وإرفاق فاتورة المشتريات" : null,
    syncedToEntries: reviewed,
  });
}

function materializeEntry({ id, payload, actor, hour = 22, reviewed = true, attachment = null, status = "active", extra = {} }) {
  const createdAt = entryCreatedAt(payload.date, hour, 10);
  const amount = payload.type === "summary"
    ? (payload.salesChannels || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
    : Number(payload.amount || 0);
  return {
    id,
    businessId: payload.businessId,
    date: payload.date,
    createdAt,
    type: payload.type,
    categoryId: payload.categoryId || null,
    amount,
    salesChannels: payload.salesChannels || [],
    note: payload.note || "",
    noteKey: payload.noteKey || null,
    enteredBy: actor,
    attachment: attachment ? { ...attachment, id: attachment.id || `attachment-${id}` } : null,
    reviewed,
    status,
    voidedAt: extra.voidedAt || null,
    voidedBy: extra.voidedBy || null,
    voidReason: extra.voidReason || "",
    restoredAt: null,
    restoredBy: null,
    restoreReason: "",
    closeoutId: payload.closeoutId || null,
    auditTrail: extra.auditTrail || [{ action: "created", at: createdAt, by: actor, reason: "" }],
  };
}

function entriesFromReviewedCloseout(closeout) {
  const actor = storeEmployee(DEMO_STORES.find((s) => s.id === closeout.storeId));
  const { entries } = buildOperationalEntriesFromCloseout(closeout, actor);
  return entries.map((item, index) => materializeEntry({
    id: `op-${closeout.id}-${item.kind}-${index}`,
    payload: item.payload,
    actor,
    hour: item.kind === "summary" ? 22 : 11 + index,
    reviewed: item.kind !== "outflow" || seededInt(`${closeout.id}|rev|${index}`, 0, 4) > 0,
    attachment: item.attachment ? demoAttachment(`att-${closeout.id}-${index}`) : null,
  }));
}

function appendEdgeCaseEntries(entries) {
  const extras = [
    materializeEntry({
      id: "demo-shami-summary-2026-05-15-pm",
      payload: {
        businessId: "shami",
        date: "2026-05-15",
        type: "summary",
        salesChannels: [
          { channelId: "cash", name: "نقدي", amount: 410 },
          { channelId: "mada", name: "مدى", amount: 690 },
        ],
        note: "تقفيلة إضافية مسائية",
      },
      actor: DEMO_ACTORS.owner,
      hour: 23,
      reviewed: true,
    }),
    materializeEntry({
      id: "demo-shami-voided-2026-05-10",
      payload: {
        businessId: "shami",
        date: "2026-05-10",
        type: "expense",
        categoryId: "other",
        amount: 95,
        note: "قيد مكرر — ملغى",
      },
      actor: DEMO_ACTORS.owner,
      hour: 16,
      reviewed: true,
      status: "voided",
      extra: {
        voidedAt: entryCreatedAt("2026-05-10", 16, 45),
        voidedBy: DEMO_ACTORS.owner,
        voidReason: "إدخال مكرر بالخطأ",
        auditTrail: [
          { action: "created", at: entryCreatedAt("2026-05-10", 16, 0), by: DEMO_ACTORS.owner, reason: "" },
          { action: "voided", at: entryCreatedAt("2026-05-10", 16, 45), by: DEMO_ACTORS.owner, reason: "إدخال مكرر بالخطأ" },
        ],
      },
    }),
    materializeEntry({
      id: "demo-arz-purchases-2026-05-20-pending",
      payload: {
        businessId: "arz",
        date: "2026-05-20",
        type: "purchases",
        amount: 640,
        note: "مستلزمات ضيافة — بانتظار مراجعة المرفق",
      },
      actor: DEMO_ACTORS.sara,
      hour: 13,
      reviewed: false,
      attachment: demoAttachment("demo-att-arz-may20"),
    }),
    materializeEntry({
      id: "demo-shami-rent-2026-05-25",
      payload: {
        businessId: "shami",
        date: "2026-05-25",
        type: "expense",
        categoryId: "rent",
        amount: 8000,
        noteKey: "rentMay",
      },
      actor: DEMO_ACTORS.owner,
      hour: 9,
      reviewed: true,
    }),
  ];
  return [...entries, ...extras];
}

function buildCloseoutEvents(closeouts) {
  const events = [];
  closeouts.forEach((closeout) => {
    const employee = storeEmployee(DEMO_STORES.find((s) => s.id === closeout.storeId));
    const actorName = employee.nameAr;
    events.push({
      id: `ev-open-${closeout.id}`,
      at: entryCreatedAt(closeout.date, 14, 0),
      type: "opened",
      closeoutId: closeout.id,
      storeId: closeout.storeId,
      storeName: closeout.storeName,
      date: closeout.date,
      dateLabel: closeout.date,
      actorName,
    });
    if (closeout.submittedAt) {
      events.push({
        id: `ev-sub-${closeout.id}`,
        at: closeout.submittedAt,
        type: "submitted",
        closeoutId: closeout.id,
        storeId: closeout.storeId,
        storeName: closeout.storeName,
        date: closeout.date,
        dateLabel: closeout.date,
        actorName,
        employeeName: actorName,
      });
    }
    if (closeout.status === CLOSEOUT_STATUS.REVIEWED && closeout.reviewedAt) {
      events.push({
        id: `ev-app-${closeout.id}`,
        at: closeout.reviewedAt,
        type: "approved",
        closeoutId: closeout.id,
        storeId: closeout.storeId,
        storeName: closeout.storeName,
        date: closeout.date,
        dateLabel: closeout.date,
        actorName: DEMO_ACTORS.owner.nameAr,
        employeeName: actorName,
      });
    }
    if (closeout.status === CLOSEOUT_STATUS.RETURNED && closeout.returnedAt) {
      events.push({
        id: `ev-ret-${closeout.id}`,
        at: closeout.returnedAt,
        type: "returned",
        closeoutId: closeout.id,
        storeId: closeout.storeId,
        storeName: closeout.storeName,
        date: closeout.date,
        dateLabel: closeout.date,
        actorName: DEMO_ACTORS.owner.nameAr,
        employeeName: actorName,
      });
    }
  });
  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}

function allDemoDates() {
  const may = Array.from({ length: 31 }, (_, i) => isoDate(2026, 4, i + 1));
  return [...may, ...JUNE_EXTRA_DAYS];
}

/** @returns {{ closeouts: object[], closeoutEvents: object[], operationalEntries: object[], lastCloseoutDates: Record<string, string> }} */
export function createPrototypeMonthDemoDataset() {
  const dates = allDemoDates();
  const closeouts = [];
  dates.forEach((date) => {
    DEMO_STORES.forEach((store) => {
      closeouts.push(buildCloseout(store, date));
    });
  });

  let operationalEntries = [];
  closeouts
    .filter((item) => item.status === CLOSEOUT_STATUS.REVIEWED)
    .forEach((closeout) => {
      operationalEntries = operationalEntries.concat(entriesFromReviewedCloseout(closeout));
    });
  operationalEntries = appendEdgeCaseEntries(operationalEntries);

  const lastCloseoutDates = {
    shami: "2026-06-02",
    arz: "2026-06-02",
  };

  return {
    closeouts: closeouts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    closeoutEvents: buildCloseoutEvents(closeouts),
    operationalEntries: operationalEntries.sort((a, b) => `${b.date}|${b.createdAt}`.localeCompare(`${a.date}|${a.createdAt}`)),
    lastCloseoutDates,
  };
}

export function createPrototypeMonthDemoOperationalEntries() {
  return createPrototypeMonthDemoDataset().operationalEntries;
}

export function countCloseoutsInMonth(closeouts, month = DEMO_MONTH) {
  return closeouts.filter((item) => item.date.startsWith(month)).length;
}

export { DEMO_MONTH };

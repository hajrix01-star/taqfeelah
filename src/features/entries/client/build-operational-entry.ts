import type {
  BuildOperationalEntryOptions,
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryAttachment,
  OperationalEntryPayload,
} from "./entries-client-types";

export function createOperationalEntryId(prefix = "entry", now = Date.now()): string {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeOperationalEntryAttachment(
  entryId: string,
  prepared: OperationalEntryAttachment | null = null,
): OperationalEntryAttachment | null {
  return prepared ? { ...prepared, id: `attachment-${entryId}` } : null;
}

export function parseOperationalAmount(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function buildOperationalEntry(
  payload: OperationalEntryPayload,
  actor: OperationalEntryActor,
  {
    createId = () => createOperationalEntryId(String(payload.type || "entry")),
    createdAt = new Date().toISOString(),
    parseAmount = parseOperationalAmount,
  }: BuildOperationalEntryOptions = {},
): OperationalEntry {
  const id = createId();
  const amount = payload.type === "summary"
    ? (payload.salesChannels || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    )
    : parseAmount(payload.amount ?? 0);

  return {
    id,
    businessId: payload.businessId,
    date: payload.date,
    createdAt,
    type: payload.type,
    categoryId: payload.categoryId || null,
    amount,
    salesChannels: payload.salesChannels || [],
    note: String(payload.note || "").trim(),
    noteKey: payload.noteKey || null,
    closeoutId: payload.closeoutId || null,
    daySequence: Number.isInteger(payload.daySequence) ? payload.daySequence : null,
    outflowId: payload.outflowId || null,
    enteredBy: actor,
    attachment: payload.attachment ? makeOperationalEntryAttachment(id, payload.attachment) : null,
    reviewed: false,
    status: "active",
    voidedAt: null,
    voidedBy: null,
    voidReason: "",
    restoredAt: null,
    restoredBy: null,
    restoreReason: "",
    auditTrail: [{ action: "created", at: createdAt, by: actor, reason: "" }],
  };
}

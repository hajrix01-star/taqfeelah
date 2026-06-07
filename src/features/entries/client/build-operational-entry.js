/**
 * @param {string} [prefix]
 * @param {number} [now]
 */
export function createOperationalEntryId(prefix = "entry", now = Date.now()) {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} entryId
 * @param {Record<string, unknown> | null | undefined} prepared
 */
export function makeOperationalEntryAttachment(entryId, prepared = null) {
  return prepared ? { ...prepared, id: `attachment-${entryId}` } : null;
}

/**
 * @param {string | number} value
 */
export function parseOperationalAmount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {Record<string, unknown>} actor
 * @param {Object} [options]
 * @param {() => string} [options.createId]
 * @param {string} [options.createdAt]
 * @param {(value: string | number) => number} [options.parseAmount]
 */
export function buildOperationalEntry(payload, actor, {
  createId = () => createOperationalEntryId(String(payload.type || "entry")),
  createdAt = new Date().toISOString(),
  parseAmount = parseOperationalAmount,
} = {}) {
  const id = createId();
  const amount = payload.type === "summary"
    ? (payload.salesChannels || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
    : parseAmount(payload.amount);

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

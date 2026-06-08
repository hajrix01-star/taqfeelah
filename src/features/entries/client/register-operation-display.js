export function filterSummaryChannelRows(entry, salesChannelFilter = "all") {
  const rows = (entry?.salesChannels || []).filter((row) => row?.channelId && Number(row.amount) > 0);
  if (salesChannelFilter === "all") return rows;
  return rows.filter((row) => row.channelId === salesChannelFilter);
}

export function buildSummaryChannelLabel(rows, resolveChannelName, summaryFallback = "summary") {
  if (!rows.length) return summaryFallback;
  return rows.map((row) => resolveChannelName(row)).join(" · ");
}

export function summarySalesChannelLabel(entry, resolveChannelName, salesChannelFilter = "all", summaryFallback = "summary") {
  return buildSummaryChannelLabel(
    filterSummaryChannelRows(entry, salesChannelFilter),
    resolveChannelName,
    summaryFallback,
  );
}

export function summaryEntryDisplayAmount(entry, salesChannelFilter = "all") {
  if (entry?.type !== "summary") return Number(entry?.amount || 0);
  if (salesChannelFilter === "all") return Number(entry?.amount || 0);
  return filterSummaryChannelRows(entry, salesChannelFilter)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

/**
 * @param {object[]} entries
 * @param {{ trustServerDaySequenceOnly?: boolean }} [options]
 */
export function buildRegisterCloseoutDayContext(entries = [], options = {}) {
  const { trustServerDaySequenceOnly = false } = options;
  const closeoutMetaById = new Map();
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!entry?.closeoutId) return;
    const existing = closeoutMetaById.get(entry.closeoutId);
    const nextMeta = {
      businessId: entry.businessId,
      date: entry.date,
      daySequence: Number.isInteger(entry.daySequence) ? entry.daySequence : null,
      createdAt: entry.createdAt || "",
    };
    if (!existing || Number.isInteger(nextMeta.daySequence)) {
      closeoutMetaById.set(entry.closeoutId, nextMeta);
    }
  });
  const byStoreDate = new Map();
  closeoutMetaById.forEach((meta, closeoutId) => {
    const key = `${meta.businessId}|${meta.date}`;
    const list = byStoreDate.get(key) || [];
    list.push({ closeoutId, ...meta });
    byStoreDate.set(key, list);
  });
  const sameDayCloseoutCountByStoreDate = new Map();
  const daySequenceByCloseoutId = new Map();
  byStoreDate.forEach((items, key) => {
    const ordered = [...items].sort((a, b) => {
      const aSeq = Number.isInteger(a.daySequence) ? a.daySequence : 999;
      const bSeq = Number.isInteger(b.daySequence) ? b.daySequence : 999;
      if (aSeq !== bSeq) return aSeq - bSeq;
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });
    sameDayCloseoutCountByStoreDate.set(key, ordered.length);
    ordered.forEach((item, index) => {
      const sequence = Number.isInteger(item.daySequence)
        ? item.daySequence
        : (trustServerDaySequenceOnly ? null : index + 1);
      daySequenceByCloseoutId.set(item.closeoutId, sequence);
    });
  });
  return { sameDayCloseoutCountByStoreDate, daySequenceByCloseoutId };
}

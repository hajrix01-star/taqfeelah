import { isUuidLike } from "@/features/org-config/client/sales-channel-display";
import type {
  CloseoutSalesChannelRow,
  CloseoutSalesRecord,
  SalesChannelConfig,
} from "./daily-closeouts-types";

const DEFAULT_CHANNEL_LABEL = "Channel";

/** Human-readable channel label — never a raw UUID. */
export function sanitizeCloseoutChannelDisplayName(
  name: unknown,
  fallback = DEFAULT_CHANNEL_LABEL,
): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed && !isUuidLike(trimmed)) return trimmed.slice(0, 120);
  return fallback;
}

function rowFromLegacyValue(
  key: string,
  value: CloseoutSalesChannelRow | number,
): CloseoutSalesChannelRow {
  if (typeof value === "number") {
    return {
      channelId: key,
      name: sanitizeCloseoutChannelDisplayName(key, DEFAULT_CHANNEL_LABEL),
      amount: value,
    };
  }
  const channelId = String(value.channelId || value.id || key || "");
  return {
    channelId,
    name: sanitizeCloseoutChannelDisplayName(
      value.name ?? channelId,
      sanitizeCloseoutChannelDisplayName(channelId, DEFAULT_CHANNEL_LABEL),
    ),
    amount: Number(value.amount || 0),
  };
}

/**
 * Canonical read path: closeout sales as a normalized array (API + legacy object).
 */
export function normalizeCloseoutSalesToArray(
  sales?: CloseoutSalesRecord | null,
): CloseoutSalesChannelRow[] {
  if (!sales) return [];
  const rows = Array.isArray(sales)
    ? sales
    : Object.entries(sales).map(([key, value]) => rowFromLegacyValue(key, value));
  return rows
    .map((row) => rowFromLegacyValue(String(row.channelId || row.id || ""), row))
    .filter((row) => Number(row.amount || 0) > 0);
}

function resolveChannelLabel(channel: SalesChannelConfig): string {
  return sanitizeCloseoutChannelDisplayName(
    channel.displayName || channel.nameAr || channel.nameEn || channel.name || channel.id,
    DEFAULT_CHANNEL_LABEL,
  );
}

function channelMatchesRow(channel: SalesChannelConfig, row: CloseoutSalesChannelRow): boolean {
  const rowKey = String(row.channelId || row.id || "");
  const extended = channel as SalesChannelConfig & { apiChannelId?: string; legacyId?: string };
  return rowKey === channel.id
    || rowKey === extended.apiChannelId
    || rowKey === extended.legacyId;
}

function normalizeSalesRowName(value: unknown): string {
  return sanitizeCloseoutChannelDisplayName(value, "");
}

/** Match persisted closeout sales rows to configured channels (ids, legacy ids, snapshot names). */
export function findCloseoutSalesRowForChannel(
  salesRows: CloseoutSalesChannelRow[],
  channel: SalesChannelConfig,
  channelLabel = "",
): CloseoutSalesChannelRow | undefined {
  const byId = salesRows.find((row) => channelMatchesRow(channel, row));
  if (byId) return byId;

  const label = normalizeSalesRowName(channelLabel);
  if (!label) return undefined;

  return salesRows.find((row) => {
    const rowLabel = normalizeSalesRowName(row.name);
    return rowLabel && rowLabel === label;
  });
}

/**
 * Canonical write path: build array-shaped sales for submit / owner edit / API.
 */
export function buildCloseoutSalesFromChannelValues(
  salesChannels: SalesChannelConfig[],
  valuesById: Record<string, string | number>,
): CloseoutSalesChannelRow[] {
  const rows: CloseoutSalesChannelRow[] = [];
  salesChannels.forEach((channel) => {
    const amount = Number(valuesById[channel.id] || 0);
    if (amount <= 0) return;
    rows.push({
      channelId: channel.id,
      name: resolveChannelLabel(channel),
      amount,
    });
  });
  return rows;
}

/** Map form values onto existing API sales rows (preserves server channel ids when possible). */
export function mergeCloseoutSalesFromChannelValues(
  salesChannels: SalesChannelConfig[],
  valuesById: Record<string, string | number>,
  existingSales?: CloseoutSalesRecord | null,
): CloseoutSalesChannelRow[] {
  const existing = normalizeCloseoutSalesToArray(existingSales);
  const rows: CloseoutSalesChannelRow[] = [];
  salesChannels.forEach((channel) => {
    const amount = Number(valuesById[channel.id] || 0);
    if (amount <= 0) return;
    const matched = findCloseoutSalesRowForChannel(existing, channel, resolveChannelLabel(channel));
    rows.push({
      channelId: String(matched?.channelId || matched?.id || channel.id),
      name: resolveChannelLabel(channel),
      amount,
    });
  });
  return rows;
}

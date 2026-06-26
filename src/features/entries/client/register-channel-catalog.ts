"use client";

import { useCallback, useMemo } from "react";
import {
  isUuidLike,
  resolveSalesChannelRowLabel,
} from "@/features/org-config/client/sales-channel-display";
import {
  channelName,
  channels,
} from "@/components/taqfeelah-app/taqfeelah-app-reference-data";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntrySalesChannelRow } from "./entries-client-types";

export function mergeRegisterConfiguredChannels(
  selectedBusiness: string,
  businessIds: string[] = [],
  resolveStoreSalesChannels: (storeId: string) => Array<Record<string, unknown>> = () => [],
): Array<Record<string, unknown>> {
  const storeIds = selectedBusiness && selectedBusiness !== "all"
    ? [selectedBusiness]
    : businessIds.filter(Boolean);
  const merged = new Map<string, Record<string, unknown>>();
  storeIds.forEach((storeId) => {
    resolveStoreSalesChannels(storeId).forEach((channel) => {
      const key = String(channel.apiChannelId || channel.id || "");
      if (key && !merged.has(key)) merged.set(key, channel);
    });
  });
  return [...merged.values()];
}

export function registerSalesChannelBadgeLabel(
  channel: { channelId?: string; amount?: number; label?: string; name?: string },
  fallback = "",
): string {
  const explicit = channel.label ?? channel.name;
  if (explicit && !isUuidLike(explicit)) return explicit;
  if (channel.channelId && !isUuidLike(channel.channelId)) return channel.channelId;
  return fallback;
}

export type RegisterChannelCatalogOptions = {
  selectedBusiness?: string;
  businessIds?: string[];
  resolveStoreSalesChannels?: (storeId: string) => Array<Record<string, unknown>>;
  lang?: DisplayLang;
};

/**
 * Single catalog for register filters, summaries, badges, and operation labels.
 */
export function useRegisterChannelCatalog({
  selectedBusiness = "all",
  businessIds = [],
  resolveStoreSalesChannels,
  lang = "ar",
}: RegisterChannelCatalogOptions = {}) {
  const configuredChannels = useMemo(() => {
    if (typeof resolveStoreSalesChannels !== "function") {
      return channels as Array<Record<string, unknown>>;
    }
    const merged = mergeRegisterConfiguredChannels(
      selectedBusiness,
      businessIds,
      resolveStoreSalesChannels,
    );
    return merged.length ? merged : (channels as Array<Record<string, unknown>>);
  }, [businessIds, resolveStoreSalesChannels, selectedBusiness]);

  const resolveChannelRowLabel = useCallback(
    (row: OperationalEntrySalesChannelRow | Record<string, unknown>) => (
      resolveSalesChannelRowLabel(row, configuredChannels, lang, channelName)
    ),
    [configuredChannels, lang],
  );

  return {
    configuredChannels,
    resolveChannelRowLabel,
  };
}

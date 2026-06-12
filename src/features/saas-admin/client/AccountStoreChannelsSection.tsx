"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createSaasAccountStoreSalesChannel,
  fetchSaasAccountStoreSalesChannels,
  type SaasAccountSalesChannel,
  updateSaasAccountStoreSalesChannel,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { resolveSaasAdminFormError, type SaasAdminFormError } from "@/features/saas-admin/client/api-error";
import { AdminCompactTable, AdminCompactTableCell } from "@/features/saas-admin/components/AdminCompactTable";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { formatEntityStatus } from "@/features/saas-admin/components/admin-display-labels";
import { formatDateTime } from "@/features/saas-admin/components/format-utils";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type StoreRow = {
  id: string;
  name: string;
  status: string;
};

type AccountStoreChannelsSectionProps = {
  organizationId: string;
  stores: StoreRow[];
};

export function AccountStoreChannelsSection({
  organizationId,
  stores,
}: AccountStoreChannelsSectionProps) {
  const { locale, t } = useSaasAdminLocale();
  const activeStores = stores.filter((store) => store.status === "active");
  const [selectedStoreId, setSelectedStoreId] = useState(activeStores[0]?.id || stores[0]?.id || "");
  const [channels, setChannels] = useState<SaasAccountSalesChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<SaasAdminFormError | null>(null);
  const [actionError, setActionError] = useState<SaasAdminFormError | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [togglingChannelId, setTogglingChannelId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    if (!selectedStoreId) {
      setChannels([]);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await fetchSaasAccountStoreSalesChannels(organizationId, selectedStoreId);
      setChannels(result.channels);
    } catch (error) {
      setLoadError(resolveSaasAdminFormError(error, t, t.channelsSection.loadError));
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedStoreId, t]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  async function handleAddChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStoreId || !newChannelName.trim()) return;

    setActionError(null);
    setIsAdding(true);
    try {
      await createSaasAccountStoreSalesChannel(organizationId, selectedStoreId, {
        name: newChannelName.trim(),
        reason: "platform_support_channel_add",
      });
      setNewChannelName("");
      await loadChannels();
    } catch (error) {
      setActionError(resolveSaasAdminFormError(error, t, t.channelsSection.addError));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleChannel(channel: SaasAccountSalesChannel) {
    if (!selectedStoreId) return;

    const nextStatus = channel.status === "retired" ? "active" : "retired";
    setActionError(null);
    setTogglingChannelId(channel.id);
    try {
      await updateSaasAccountStoreSalesChannel(organizationId, selectedStoreId, {
        salesChannelId: channel.id,
        status: nextStatus,
        reason: nextStatus === "retired"
          ? "platform_support_channel_retire"
          : "platform_support_channel_restore",
      });
      await loadChannels();
    } catch (error) {
      setActionError(resolveSaasAdminFormError(error, t, t.channelsSection.toggleError));
    } finally {
      setTogglingChannelId(null);
    }
  }

  if (stores.length === 0) {
    return null;
  }

  return (
    <AdminCard padding="md" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--admin-text)]">{t.channelsSection.title}</p>
          <p className="text-xs text-[var(--admin-muted)]">{t.channelsSection.description}</p>
        </div>
        {stores.length > 1 ? (
          <label className="block space-y-1 text-xs">
            <span className="text-[var(--admin-muted)]">{t.channelsSection.storeLabel}</span>
            <select
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {loadError ? (
        <AdminErrorAlert message={loadError.message} cause={loadError.cause} code={loadError.code} />
      ) : null}
      {actionError ? (
        <AdminErrorAlert message={actionError.message} cause={actionError.cause} code={actionError.code} />
      ) : null}

      <AdminCompactTable
        columns={[t.common.name, t.common.status, t.accountDetails.createdAt, ""]}
        empty={!isLoading && channels.length === 0}
        emptyMessage={isLoading ? t.common.loading : t.common.noData}
      >
        {channels.map((channel) => (
          <tr key={channel.id} className="hover:bg-[var(--admin-hover)]">
            <AdminCompactTableCell col={0} className="font-semibold text-[var(--admin-text)]">
              {channel.name}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={1}>{formatEntityStatus(channel.status, t)}</AdminCompactTableCell>
            <AdminCompactTableCell col={2} className="text-[var(--admin-muted)]">
              {formatDateTime(channel.createdAt, locale)}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={3}>
              <button
                type="button"
                disabled={togglingChannelId === channel.id}
                onClick={() => { void handleToggleChannel(channel); }}
                className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] disabled:opacity-50"
              >
                {channel.status === "retired"
                  ? t.channelsSection.restoreChannel
                  : t.channelsSection.archiveChannel}
              </button>
            </AdminCompactTableCell>
          </tr>
        ))}
      </AdminCompactTable>

      <form onSubmit={handleAddChannel} className="flex flex-wrap items-end gap-2 border-t border-[var(--admin-border)] pt-3">
        <label className="block min-w-[12rem] flex-1 space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.channelsSection.addChannel}</span>
          <input
            required
            value={newChannelName}
            onChange={(event) => setNewChannelName(event.target.value)}
            placeholder={t.channelsSection.channelNamePlaceholder}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isAdding || !selectedStoreId}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isAdding ? t.channelsSection.adding : t.channelsSection.addChannel}
        </button>
      </form>
    </AdminCard>
  );
}

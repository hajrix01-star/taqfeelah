"use client";

import { FormEvent, useState } from "react";
import {
  createSaasAccountStore,
  updateSaasAccountStore,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { resolveSaasAdminFormError, type SaasAdminFormError } from "@/features/saas-admin/client/api-error";
import { AdminCompactTable, AdminCompactTableCell } from "@/features/saas-admin/components/AdminCompactTable";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminModal } from "@/features/saas-admin/components/AdminModal";
import { formatEntityStatus } from "@/features/saas-admin/components/admin-display-labels";
import { formatDateTime } from "@/features/saas-admin/components/format-utils";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type StoreRow = {
  id: string;
  name: string;
  location: string;
  status: string;
  createdAt: string;
};

type AccountStoresSectionProps = {
  organizationId: string;
  stores: StoreRow[];
  onUpdated: () => void;
  readOnly?: boolean;
};

function AddStoreForm({
  organizationId,
  onCreated,
  onCancel,
}: {
  organizationId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { t } = useSaasAdminLocale();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<SaasAdminFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createSaasAccountStore(organizationId, {
        name,
        location: location.trim() || undefined,
      });
      setName("");
      setLocation("");
      onCreated();
    } catch (submitError) {
      setError(resolveSaasAdminFormError(submitError, t, t.storesSection.submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.common.name}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.storesSection.location}</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
      </div>
      {error ? (
        <AdminErrorAlert message={error.message} cause={error.cause} code={error.code} />
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-text)]"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? t.storesSection.submitting : t.storesSection.submit}
        </button>
      </div>
    </form>
  );
}

function EditStoreForm({
  organizationId,
  store,
  onUpdated,
  onCancel,
}: {
  organizationId: string;
  store: StoreRow;
  onUpdated: () => void;
  onCancel: () => void;
}) {
  const { t } = useSaasAdminLocale();
  const [name, setName] = useState(store.name);
  const [location, setLocation] = useState(store.location);
  const [error, setError] = useState<SaasAdminFormError | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await updateSaasAccountStore(organizationId, store.id, {
        name,
        location,
      });
      onUpdated();
    } catch (submitError) {
      setError(resolveSaasAdminFormError(submitError, t, t.storesSection.saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.common.name}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.storesSection.location}</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
      </div>
      {error ? (
        <AdminErrorAlert message={error.message} cause={error.cause} code={error.code} />
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-text)]"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? t.storesSection.saving : t.storesSection.save}
        </button>
      </div>
    </form>
  );
}

export function AccountStoresSection({
  organizationId,
  stores,
  onUpdated,
  readOnly = false,
}: AccountStoresSectionProps) {
  const { locale, t } = useSaasAdminLocale();
  const [addOpen, setAddOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null);
  const [togglingStoreId, setTogglingStoreId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<SaasAdminFormError | null>(null);

  async function handleToggleStatus(store: StoreRow) {
    const nextStatus = store.status === "archived" ? "active" : "archived";
    setToggleError(null);
    setTogglingStoreId(store.id);
    try {
      await updateSaasAccountStore(organizationId, store.id, { status: nextStatus });
      onUpdated();
    } catch (submitError) {
      setToggleError(resolveSaasAdminFormError(submitError, t, t.storesSection.toggleError));
    } finally {
      setTogglingStoreId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--admin-muted)]">
          {t.common.stores}
          {" · "}
          {stores.length}
        </p>
        {readOnly ? null : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t.storesSection.addStore}
          </button>
        )}
      </div>

      {toggleError ? (
        <AdminErrorAlert message={toggleError.message} cause={toggleError.cause} code={toggleError.code} />
      ) : null}

      <AdminCompactTable
        columns={[t.common.name, t.storesSection.location, t.common.status, t.accountDetails.createdAt, ""]}
        empty={stores.length === 0}
        emptyMessage={t.common.noData}
      >
        {stores.map((row) => (
          <tr key={row.id} className="hover:bg-[var(--admin-hover)]">
            <AdminCompactTableCell col={0} className="font-semibold text-[var(--admin-text)]">
              {row.name}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={1} className="text-[var(--admin-muted)]">
              {row.location || "—"}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={2}>{formatEntityStatus(row.status, t)}</AdminCompactTableCell>
            <AdminCompactTableCell col={3} className="text-[var(--admin-muted)]">
              {formatDateTime(row.createdAt, locale)}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={4}>
              {readOnly ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingStore(row)}
                    className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
                  >
                    {t.storesSection.editStore}
                  </button>
                  <button
                    type="button"
                    disabled={togglingStoreId === row.id}
                    onClick={() => { void handleToggleStatus(row); }}
                    className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] disabled:opacity-50"
                  >
                    {row.status === "archived"
                      ? t.storesSection.restoreStore
                      : t.storesSection.archiveStore}
                  </button>
                </div>
              )}
            </AdminCompactTableCell>
          </tr>
        ))}
      </AdminCompactTable>

      <AdminModal
        open={addOpen}
        title={t.storesSection.addTitle}
        onClose={() => setAddOpen(false)}
      >
        <AddStoreForm
          organizationId={organizationId}
          onCreated={() => {
            setAddOpen(false);
            onUpdated();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </AdminModal>

      <AdminModal
        open={editingStore !== null}
        title={t.storesSection.editTitle}
        onClose={() => setEditingStore(null)}
      >
        {editingStore ? (
          <EditStoreForm
            organizationId={organizationId}
            store={editingStore}
            onUpdated={() => {
              setEditingStore(null);
              onUpdated();
            }}
            onCancel={() => setEditingStore(null)}
          />
        ) : null}
      </AdminModal>
    </div>
  );
}

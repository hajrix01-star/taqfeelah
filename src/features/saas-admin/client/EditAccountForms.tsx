"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  repairSaasAccountFoundation,
  updateSaasAccount,
  updateSaasAccountOwner,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type EditAccountFormsProps = {
  organizationId: string;
  organizationName: string;
  organizationStatus: string;
  ownerName: string | null;
  ownerUsername?: string | null;
  onUpdated: () => void;
};

export function EditAccountForms({
  organizationId,
  organizationName,
  organizationStatus,
  ownerName,
  ownerUsername = null,
  onUpdated,
}: EditAccountFormsProps) {
  const { t } = useSaasAdminLocale();
  const [accountName, setAccountName] = useState(organizationName);
  const [accountStatus, setAccountStatus] = useState(organizationStatus === "suspended" ? "suspended" : "active");
  const [editOwnerName, setEditOwnerName] = useState(ownerName || "");
  const [editOwnerUsername, setEditOwnerUsername] = useState(ownerUsername || "");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");

  useEffect(() => {
    setEditOwnerUsername(ownerUsername || "");
  }, [ownerUsername]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSavingAccount(true);
    try {
      await updateSaasAccount(organizationId, {
        organizationName: accountName,
        status: accountStatus as "active" | "suspended",
      });
      setSuccess(t.editAccount.accountSaved);
      onUpdated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.editAccount.saveError);
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleOwnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSavingOwner(true);
    try {
      await updateSaasAccountOwner(organizationId, {
        ownerName: editOwnerName || undefined,
        ownerUsername: editOwnerUsername || undefined,
        ownerPassword: editOwnerPassword || undefined,
      });
      setSuccess(t.editAccount.ownerSaved);
      setEditOwnerPassword("");
      onUpdated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.editAccount.saveError);
    } finally {
      setIsSavingOwner(false);
    }
  }

  async function handleRepair() {
    setError(null);
    setSuccess(null);
    setIsRepairing(true);
    try {
      const result = await repairSaasAccountFoundation(organizationId);
      setSuccess(result.repaired ? t.editAccount.repairDone : t.editAccount.repairSkipped);
      onUpdated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.editAccount.repairError);
    } finally {
      setIsRepairing(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAccountSubmit} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.editAccount.accountTitle}</h3>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.editAccount.organizationName}</span>
          <input
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.common.status}</span>
          <select
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          >
            <option value="active">{t.status.active}</option>
            <option value="suspended">{t.status.suspended}</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={isSavingAccount}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSavingAccount ? t.editAccount.saving : t.editAccount.saveAccount}
        </button>
      </form>

      <form onSubmit={handleOwnerSubmit} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.editAccount.ownerTitle}</h3>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.newAccount.ownerName}</span>
          <input
            value={editOwnerName}
            onChange={(e) => setEditOwnerName(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.newAccount.ownerUsername}</span>
          <input
            value={editOwnerUsername}
            onChange={(e) => setEditOwnerUsername(e.target.value)}
            placeholder={t.editAccount.usernameOptional}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            dir="ltr"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.newAccount.ownerPassword}</span>
          <input
            type="password"
            value={editOwnerPassword}
            onChange={(e) => setEditOwnerPassword(e.target.value)}
            placeholder={t.editAccount.passwordOptional}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            dir="ltr"
          />
        </label>
        <button
          type="submit"
          disabled={isSavingOwner}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSavingOwner ? t.editAccount.saving : t.editAccount.saveOwner}
        </button>
      </form>

      <section className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[#FAFBFC] p-4">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.editAccount.repairTitle}</h3>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">{t.editAccount.repairDescription}</p>
        <button
          type="button"
          disabled={isRepairing}
          onClick={() => { void handleRepair(); }}
          className="mt-3 rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary)] disabled:opacity-50"
        >
          {isRepairing ? t.editAccount.repairing : t.editAccount.repairAction}
        </button>
      </section>

      {error ? <p className="text-sm text-[var(--admin-danger)]">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
    </div>
  );
}

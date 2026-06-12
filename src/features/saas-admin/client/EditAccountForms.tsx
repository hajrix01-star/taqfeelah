"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  repairSaasAccountFoundation,
  updateSaasAccount,
  updateSaasAccountOwner,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { parsePlanCode, type PlanCode } from "@/features/billing/plan-codes";
import { mapSaasAdminApiError } from "@/features/saas-admin/client/api-error";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type EditAccountFormsProps = {
  organizationId: string;
  organizationName: string;
  planCode: string | null;
  ownerName: string | null;
  ownerUsername?: string | null;
  onUpdated: () => void;
  showAccountForm?: boolean;
  showOwnerForm?: boolean;
  showRepairForm?: boolean;
};

function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolvePlanCode(value: string | null | undefined): PlanCode {
  return parsePlanCode(value) ?? "starter";
}

export function EditAccountForms({
  organizationId,
  organizationName,
  planCode,
  ownerName,
  ownerUsername = null,
  onUpdated,
  showAccountForm = true,
  showOwnerForm = true,
  showRepairForm = true,
}: EditAccountFormsProps) {
  const { t } = useSaasAdminLocale();

  function formatError(error: unknown, fallback: string) {
    if (!(error instanceof Error)) return fallback;
    return mapSaasAdminApiError(error, t) || fallback;
  }
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [accountName, setAccountName] = useState(organizationName);
  const [accountPlan, setAccountPlan] = useState<PlanCode>(resolvePlanCode(planCode));
  const [editOwnerName, setEditOwnerName] = useState(ownerName || "");
  const [editOwnerUsername, setEditOwnerUsername] = useState(ownerUsername || "");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [ownerSuccess, setOwnerSuccess] = useState<string | null>(null);
  const [repairSuccess, setRepairSuccess] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  useEffect(() => {
    setAccountName(organizationName);
    setAccountPlan(resolvePlanCode(planCode));
  }, [organizationName, planCode]);

  useEffect(() => {
    setEditOwnerName(ownerName || "");
    setEditOwnerUsername(ownerUsername || "");
  }, [ownerName, ownerUsername]);

  function showFeedback() {
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError(null);
    setAccountSuccess(null);
    setIsSavingAccount(true);
    try {
      await updateSaasAccount(organizationId, {
        organizationName: trimOptional(accountName),
        planCode: accountPlan,
      });
      setAccountSuccess(t.editAccount.accountSaved);
      onUpdated();
      showFeedback();
    } catch (submitError) {
      setAccountError(formatError(submitError, t.editAccount.saveError));
      showFeedback();
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleOwnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOwnerError(null);
    setOwnerSuccess(null);
    setIsSavingOwner(true);
    try {
      const payload = {
        ownerName: trimOptional(editOwnerName),
        ownerUsername: trimOptional(editOwnerUsername),
        ownerPassword: trimOptional(editOwnerPassword),
      };
      if (!payload.ownerName && !payload.ownerUsername && !payload.ownerPassword) {
        throw new Error(t.editAccount.ownerNoChanges);
      }
      await updateSaasAccountOwner(organizationId, payload);
      setOwnerSuccess(t.editAccount.ownerSaved);
      setEditOwnerPassword("");
      onUpdated();
      showFeedback();
    } catch (submitError) {
      setOwnerError(formatError(submitError, t.editAccount.saveError));
      showFeedback();
    } finally {
      setIsSavingOwner(false);
    }
  }

  async function handleRepair() {
    setRepairError(null);
    setRepairSuccess(null);
    setIsRepairing(true);
    try {
      const result = await repairSaasAccountFoundation(organizationId);
      setRepairSuccess(result.repaired ? t.editAccount.repairDone : t.editAccount.repairSkipped);
      onUpdated();
      showFeedback();
    } catch (submitError) {
      setRepairError(formatError(submitError, t.editAccount.repairError));
      showFeedback();
    } finally {
      setIsRepairing(false);
    }
  }

  return (
    <div className="space-y-4">
      {showAccountForm ? (
      <AdminCard as="form" padding="md" className="space-y-3" onSubmit={handleAccountSubmit}>
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
          <span className="text-[var(--admin-muted)]">{t.common.plan}</span>
          <select
            value={accountPlan}
            onChange={(e) => setAccountPlan(e.target.value as typeof accountPlan)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          >
            <option value="trial">{t.plans.trial}</option>
            <option value="starter">{t.plans.starter}</option>
            <option value="growth">{t.plans.growth}</option>
            <option value="enterprise">{t.plans.enterprise}</option>
          </select>
        </label>
        {accountError ? <p className="text-sm text-[var(--admin-danger)]">{accountError}</p> : null}
        {accountSuccess ? <p className="text-sm text-green-700">{accountSuccess}</p> : null}
        <button
          type="submit"
          disabled={isSavingAccount}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSavingAccount ? t.editAccount.saving : t.editAccount.saveAccount}
        </button>
      </AdminCard>
      ) : null}

      {showOwnerForm ? (
      <AdminCard as="form" padding="md" className="space-y-3" onSubmit={handleOwnerSubmit}>
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.editAccount.ownerTitle}</h3>
        <p className="text-xs leading-6 text-[var(--admin-muted)]">{t.editAccount.ownerCredentialsHint}</p>
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
        {ownerError ? <p className="text-sm text-[var(--admin-danger)]">{ownerError}</p> : null}
        {ownerSuccess ? <p className="text-sm text-green-700">{ownerSuccess}</p> : null}
        <button
          type="submit"
          disabled={isSavingOwner}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSavingOwner ? t.editAccount.saving : t.editAccount.saveOwner}
        </button>
      </AdminCard>
      ) : null}

      {showRepairForm ? (
      <AdminCard variant="dashed" padding="md" className="bg-[var(--admin-surface-muted)]">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.editAccount.repairTitle}</h3>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">{t.editAccount.repairDescription}</p>
        {repairError ? <p className="mt-2 text-sm text-[var(--admin-danger)]">{repairError}</p> : null}
        {repairSuccess ? <p className="mt-2 text-sm text-green-700">{repairSuccess}</p> : null}
        <button
          type="button"
          disabled={isRepairing}
          onClick={() => { void handleRepair(); }}
          className="mt-3 rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary)] disabled:opacity-50"
        >
          {isRepairing ? t.editAccount.repairing : t.editAccount.repairAction}
        </button>
      </AdminCard>
      ) : null}

      <div ref={feedbackRef} />
    </div>
  );
}

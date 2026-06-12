"use client";

import { FormEvent, useEffect, useState } from "react";
import { updateSaasAccountMember } from "@/features/saas-admin/client/saas-admin-api-client";
import {
  formatEntityStatus,
  formatMemberRole,
} from "@/features/saas-admin/components/admin-display-labels";
import { mapSaasAdminApiError } from "@/features/saas-admin/client/api-error";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type MemberRow = {
  memberId: string;
  userId: string;
  name: string;
  role: string;
  status: string;
};

type EditAccountMemberFormProps = {
  organizationId: string;
  member: MemberRow;
  onUpdated: () => void;
};

function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function EditAccountMemberForm({
  organizationId,
  member,
  onUpdated,
}: EditAccountMemberFormProps) {
  const { t } = useSaasAdminLocale();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<"manager" | "employee">(
    member.role === "manager" ? "manager" : "employee",
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    member.status === "inactive" ? "inactive" : "active",
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(member.name);
    setRole(member.role === "manager" ? "manager" : "employee");
    setStatus(member.status === "inactive" ? "inactive" : "active");
    setPin("");
    setError(null);
    setSuccess(null);
  }, [member.memberId, member.name, member.role, member.status]);

  if (member.role === "owner") {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await updateSaasAccountMember(organizationId, member.memberId, {
        name: trimOptional(name),
        role,
        status,
        pin: trimOptional(pin),
      });
      setSuccess(t.editMember.saved);
      setPin("");
      onUpdated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? mapSaasAdminApiError(submitError, t) || t.editMember.saveError
          : t.editMember.saveError,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-start text-sm"
      >
        <span className="font-semibold text-[var(--admin-primary)]">{member.name}</span>
        <span className="text-xs text-[var(--admin-muted)]">
          {formatMemberRole(member.role, t)}
          {" · "}
          {formatEntityStatus(member.status, t)}
        </span>
      </button>
      {open ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-[var(--admin-border)] pt-3">
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.common.name}</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.common.role}</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
              >
                <option value="employee">{t.addMember.roleEmployee}</option>
                <option value="manager">{t.addMember.roleManager}</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.common.status}</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
              >
                <option value="active">{t.entityStatus.active}</option>
                <option value="inactive">{t.entityStatus.inactive}</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.editMember.pinOptional}</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder={t.editMember.pinOptionalHint}
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
              dir="ltr"
            />
          </label>
          {error ? <p className="text-sm text-[var(--admin-danger)]">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? t.editMember.saving : t.editMember.save}
          </button>
        </form>
      ) : null}
    </div>
  );
}

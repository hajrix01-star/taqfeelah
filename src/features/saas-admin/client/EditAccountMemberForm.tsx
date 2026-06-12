"use client";

import { FormEvent, useEffect, useState } from "react";
import { updateSaasAccountMember } from "@/features/saas-admin/client/saas-admin-api-client";
import { mapSaasAdminApiError } from "@/features/saas-admin/client/api-error";
import { AdminModal } from "@/features/saas-admin/components/AdminModal";
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
  member: MemberRow | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function EditAccountMemberForm({
  organizationId,
  member,
  open,
  onClose,
  onUpdated,
}: EditAccountMemberFormProps) {
  const { t } = useSaasAdminLocale();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"manager" | "employee">("employee");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setName(member.name);
    setRole(member.role === "manager" ? "manager" : "employee");
    setStatus(member.status === "inactive" ? "inactive" : "active");
    setPin("");
    setError(null);
    setSuccess(null);
  }, [member]);

  if (!member || member.role === "owner") {
    return null;
  }

  const memberId = member.memberId;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await updateSaasAccountMember(organizationId, memberId, {
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
    <AdminModal open={open} title={t.editMember.title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-text)]"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? t.editMember.saving : t.editMember.save}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

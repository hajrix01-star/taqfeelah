"use client";

import { FormEvent, useState } from "react";
import { LoginPhoneFields } from "@/core/phone/LoginPhoneFields";
import { resolveSaasAdminFormError, type SaasAdminFormError } from "@/features/saas-admin/client/api-error";
import { createSaasAccountMember } from "@/features/saas-admin/client/saas-admin-api-client";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type StoreOption = {
  id: string;
  name: string;
  status?: string;
};

type AddAccountMemberFormProps = {
  organizationId: string;
  stores: StoreOption[];
  onCreated: () => void;
  onCancel?: () => void;
};

export function AddAccountMemberForm({
  organizationId,
  stores,
  onCreated,
  onCancel,
}: AddAccountMemberFormProps) {
  const { t } = useSaasAdminLocale();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"employee" | "manager">("employee");
  const [loginPhone, setLoginPhone] = useState("");
  const [pin, setPin] = useState("");
  const [storeIds, setStoreIds] = useState<string[]>(stores.map((store) => store.id));
  const [error, setError] = useState<SaasAdminFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleStore(storeId: string) {
    setStoreIds((current) => (
      current.includes(storeId)
        ? current.filter((id) => id !== storeId)
        : [...current, storeId]
    ));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createSaasAccountMember(organizationId, {
        name,
        role,
        pin,
        loginPhone: loginPhone.trim() || undefined,
        storeIds,
      });
      setName("");
      setLoginPhone("");
      setPin("");
      onCreated();
    } catch (submitError) {
      setError(resolveSaasAdminFormError(submitError, t, t.addMember.submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.common.name}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.common.role}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          >
            <option value="employee">{t.addMember.roleEmployee}</option>
            <option value="manager">{t.addMember.roleManager}</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.editMember.loginPhone}</span>
          <LoginPhoneFields value={loginPhone} onChange={setLoginPhone} />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--admin-muted)]">{t.addMember.pin}</span>
          <input
            required
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            dir="ltr"
          />
        </label>
      </div>
      {stores.length > 0 ? (
        <fieldset className="space-y-2 text-sm">
          <legend className="text-[var(--admin-muted)]">{t.addMember.storeAccess}</legend>
          <div className="flex flex-wrap gap-3">
            {stores.map((store) => (
              <label key={store.id} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={storeIds.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                />
                <span>{store.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {error ? (
        <AdminErrorAlert message={error.message} cause={error.cause} code={error.code} />
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-text)]"
          >
            {t.common.cancel}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? t.addMember.submitting : t.addMember.submit}
        </button>
      </div>
    </form>
  );
}

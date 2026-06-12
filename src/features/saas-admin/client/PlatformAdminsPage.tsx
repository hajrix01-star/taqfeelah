"use client";

import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { AdminTable, AdminTableCell } from "@/features/saas-admin/components/AdminTable";
import { formatDateTime } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import {
  createPlatformAdmin,
  fetchPlatformAdmins,
  grantPlatformAdminAccess,
  lookupPlatformAdmin,
  revokePlatformAdminAccess,
  updatePlatformAdminRole,
  type PlatformAdminLookup,
  type PlatformAdminRole,
  type PlatformAdminRow,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AddMode = "existing" | "new";

export default function PlatformAdminsPage() {
  const { locale, t } = useSaasAdminLocale();
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useSaasAdminQuery(
    ["saas-admin", "platform-admins"],
    fetchPlatformAdmins,
  );

  const [addMode, setAddMode] = useState<AddMode>("new");
  const [lookupUsername, setLookupUsername] = useState("");
  const [lookupResult, setLookupResult] = useState<PlatformAdminLookup | null>(null);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<PlatformAdminRole>("support");
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  function formatPlatformRole(role: PlatformAdminRole) {
    return role === "owner" ? t.platformAdmins.roleOwner : t.platformAdmins.roleSupport;
  }

  async function refreshAdmins() {
    await queryClient.invalidateQueries({ queryKey: ["saas-admin", "platform-admins"] });
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setLookupResult(null);
    setIsSubmitting(true);
    try {
      const candidate = await lookupPlatformAdmin(lookupUsername.trim());
      setLookupResult(candidate);
    } catch (lookupError) {
      setFormError(lookupError instanceof Error ? lookupError.message : t.platformAdmins.lookupError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGrant(userId: string) {
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);
    try {
      await grantPlatformAdminAccess(userId, newRole);
      setLookupResult(null);
      setLookupUsername("");
      setFormSuccess(t.platformAdmins.grantSuccess);
      await refreshAdmins();
    } catch (grantError) {
      setFormError(grantError instanceof Error ? grantError.message : t.platformAdmins.grantError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);
    try {
      await createPlatformAdmin({
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setFormSuccess(t.platformAdmins.createSuccess);
      await refreshAdmins();
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : t.platformAdmins.createError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(admin: PlatformAdminRow, role: PlatformAdminRole) {
    if (admin.source === "env") return;
    setFormError(null);
    setFormSuccess(null);
    setUpdatingRoleUserId(admin.userId);
    try {
      await updatePlatformAdminRole(admin.userId, role);
      setFormSuccess(t.platformAdmins.roleUpdateSuccess);
      await refreshAdmins();
    } catch (roleError) {
      setFormError(roleError instanceof Error ? roleError.message : t.platformAdmins.roleUpdateError);
    } finally {
      setUpdatingRoleUserId(null);
    }
  }

  async function handleRevoke(admin: PlatformAdminRow) {
    if (!admin.canRevoke) return;
    setFormError(null);
    setFormSuccess(null);
    setRevokingUserId(admin.userId);
    try {
      await revokePlatformAdminAccess(admin.userId);
      setFormSuccess(t.platformAdmins.revokeSuccess);
      await refreshAdmins();
    } catch (revokeError) {
      setFormError(revokeError instanceof Error ? revokeError.message : t.platformAdmins.revokeError);
    } finally {
      setRevokingUserId(null);
    }
  }

  if (isLoading) return <LoadingSkeleton />;

  const admins = data?.admins ?? [];

  return (
    <>
      <AdminHeader
        title={t.platformAdmins.title}
        description={t.platformAdmins.description}
      />
      <AdminPageBody className="space-y-4">
        {error ? (
          <AdminErrorAlert
            message={error instanceof Error ? error.message : t.platformAdmins.loadError}
          />
        ) : null}
        {formError ? <AdminErrorAlert message={formError} /> : null}
        {formSuccess ? (
          <AdminCallout tone="info">{formSuccess}</AdminCallout>
        ) : null}

        <AdminCallout tone="info">{t.platformAdmins.envHint}</AdminCallout>

        <AdminCard padding="md" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAddMode("new");
                setLookupResult(null);
                setFormError(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                addMode === "new"
                  ? "bg-[var(--admin-primary)] text-white"
                  : "bg-[var(--admin-surface-muted)] text-[var(--admin-text)]"
              }`}
            >
              {t.platformAdmins.addNew}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode("existing");
                setFormError(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                addMode === "existing"
                  ? "bg-[var(--admin-primary)] text-white"
                  : "bg-[var(--admin-surface-muted)] text-[var(--admin-text)]"
              }`}
            >
              {t.platformAdmins.grantExisting}
            </button>
          </div>

          {addMode === "new" ? (
            <form onSubmit={(event) => { void handleCreate(event); }} className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="text-[var(--admin-muted)]">{t.common.name}</span>
                <input
                  required
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.platformAdmins.username}</span>
                <input
                  required
                  dir="ltr"
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  autoComplete="off"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.platformAdmins.password}</span>
                <input
                  required
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  autoComplete="new-password"
                />
              </label>
              <label className="block space-y-1 text-sm sm:col-span-2">
                <span className="text-[var(--admin-muted)]">{t.platformAdmins.platformRole}</span>
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as PlatformAdminRole)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                >
                  <option value="support">{t.platformAdmins.roleSupport}</option>
                  <option value="owner">{t.platformAdmins.roleOwner}</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
              >
                {isSubmitting ? t.platformAdmins.creating : t.platformAdmins.createAdmin}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.platformAdmins.platformRole}</span>
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as PlatformAdminRole)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                >
                  <option value="support">{t.platformAdmins.roleSupport}</option>
                  <option value="owner">{t.platformAdmins.roleOwner}</option>
                </select>
              </label>
              <form onSubmit={(event) => { void handleLookup(event); }} className="flex flex-col gap-3 sm:flex-row">
                <label className="block min-w-0 flex-1 space-y-1 text-sm">
                  <span className="text-[var(--admin-muted)]">{t.platformAdmins.lookupUsername}</span>
                  <input
                    required
                    dir="ltr"
                    value={lookupUsername}
                    onChange={(event) => setLookupUsername(event.target.value)}
                    className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[var(--admin-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--admin-text)] disabled:opacity-50 sm:self-end"
                >
                  {isSubmitting ? t.platformAdmins.searching : t.platformAdmins.searchUser}
                </button>
              </form>

              {lookupResult ? (
                <AdminCard variant="inset" padding="sm" className="space-y-2 text-sm">
                  <p className="font-semibold text-[var(--admin-text)]">{lookupResult.name}</p>
                  <p className="text-[var(--admin-muted)]" dir="ltr">
                    {lookupResult.username || "—"}
                  </p>
                  {lookupResult.alreadyGranted ? (
                    <p className="text-[var(--admin-muted)]">{t.platformAdmins.alreadyGranted}</p>
                  ) : lookupResult.hasPasswordLogin ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => { void handleGrant(lookupResult.userId); }}
                      className="rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {t.platformAdmins.grantAccess}
                    </button>
                  ) : (
                    <p className="text-[var(--admin-danger)]">{t.platformAdmins.needsPasswordLogin}</p>
                  )}
                </AdminCard>
              ) : null}
            </div>
          )}
        </AdminCard>

        <AdminTable
          columns={[
            t.common.name,
            t.platformAdmins.username,
            t.platformAdmins.platformRole,
            t.platformAdmins.source,
            t.common.date,
            "",
          ]}
          empty={admins.length === 0}
          emptyMessage={t.common.noData}
        >
          {admins.map((admin) => (
            <tr key={admin.userId} className="hover:bg-[var(--admin-hover)]">
              <AdminTableCell col={0}>{admin.name}</AdminTableCell>
              <AdminTableCell col={1} className="text-[var(--admin-muted)]">
                <span dir="ltr">{admin.username || "—"}</span>
              </AdminTableCell>
              <AdminTableCell col={2}>
                {admin.source === "database" && admin.canRevoke ? (
                  <select
                    value={admin.platformRole}
                    disabled={updatingRoleUserId === admin.userId}
                    onChange={(event) => {
                      void handleRoleChange(admin, event.target.value as PlatformAdminRole);
                    }}
                    className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-xs"
                  >
                    <option value="support">{t.platformAdmins.roleSupport}</option>
                    <option value="owner">{t.platformAdmins.roleOwner}</option>
                  </select>
                ) : (
                  formatPlatformRole(admin.platformRole)
                )}
              </AdminTableCell>
              <AdminTableCell col={3}>
                {admin.source === "env" ? t.platformAdmins.sourceEnv : t.platformAdmins.sourceDatabase}
              </AdminTableCell>
              <AdminTableCell col={4} className="text-[var(--admin-muted)]">
                {admin.grantedAt ? formatDateTime(admin.grantedAt, locale) : "—"}
              </AdminTableCell>
              <AdminTableCell col={5}>
                {admin.canRevoke ? (
                  <button
                    type="button"
                    disabled={revokingUserId === admin.userId}
                    onClick={() => { void handleRevoke(admin); }}
                    className="rounded-md border border-[var(--admin-danger)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-danger)] disabled:opacity-50"
                  >
                    {revokingUserId === admin.userId
                      ? t.platformAdmins.revoking
                      : t.platformAdmins.revoke}
                  </button>
                ) : (
                  <span className="text-xs text-[var(--admin-muted)]">—</span>
                )}
              </AdminTableCell>
            </tr>
          ))}
        </AdminTable>
      </AdminPageBody>
    </>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { formatDateTime } from "@/features/saas-admin/components/format-utils";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import {
  createPlatformAdmin,
  fetchPlatformAdmins,
  grantPlatformAdminAccess,
  lookupPlatformAdmin,
  revokePlatformAdminAccess,
  updatePlatformAdminProfile,
  updatePlatformAdminRole,
  type PlatformAdminLookup,
  type PlatformAdminRole,
  type PlatformAdminRow,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import { useSaasAdminSession } from "@/features/saas-admin/client/SaasAdminSessionProvider";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";

type AddMode = "existing" | "new";

type EditDraft = {
  name: string;
  username: string;
  password: string;
};

function PlatformAdminListItem({
  admin,
  locale,
  canManage,
  updatingRoleUserId,
  revokingUserId,
  editingUserId,
  editDraft,
  isSavingCredentials,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onSaveCredentials,
  onRoleChange,
  onRevoke,
  formatPlatformRole,
  t,
}: {
  admin: PlatformAdminRow;
  locale: SaasAdminLocale;
  canManage: boolean;
  updatingRoleUserId: string | null;
  revokingUserId: string | null;
  editingUserId: string | null;
  editDraft: EditDraft | null;
  isSavingCredentials: boolean;
  onStartEdit: (admin: PlatformAdminRow) => void;
  onCancelEdit: () => void;
  onEditDraftChange: (draft: EditDraft) => void;
  onSaveCredentials: (event: FormEvent<HTMLFormElement>, admin: PlatformAdminRow) => void;
  onRoleChange: (admin: PlatformAdminRow, role: PlatformAdminRole) => void;
  onRevoke: (admin: PlatformAdminRow) => void;
  formatPlatformRole: (role: PlatformAdminRole) => string;
  t: ReturnType<typeof useSaasAdminLocale>["t"];
}) {
  const isEditing = editingUserId === admin.userId;

  return (
    <AdminCard variant="inset" padding="sm" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{admin.name}</p>
          <p className="truncate text-xs text-[var(--admin-muted)]" dir="ltr">
            {admin.username || "—"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {admin.source === "database" && admin.canRevoke && canManage ? (
              <select
                value={admin.platformRole}
                disabled={updatingRoleUserId === admin.userId}
                onChange={(event) => {
                  void onRoleChange(admin, event.target.value as PlatformAdminRole);
                }}
                className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-xs"
              >
                <option value="support">{t.platformAdmins.roleSupport}</option>
                <option value="owner">{t.platformAdmins.roleOwner}</option>
              </select>
            ) : (
              <span className="rounded-full bg-[var(--admin-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--admin-text)]">
                {formatPlatformRole(admin.platformRole)}
              </span>
            )}
            <span className="rounded-full border border-[var(--admin-border)] px-2 py-0.5 text-[11px] text-[var(--admin-muted)]">
              {admin.source === "env" ? t.platformAdmins.sourceEnv : t.platformAdmins.sourceDatabase}
            </span>
            {admin.grantedAt ? (
              <span className="text-[11px] text-[var(--admin-muted)]">
                {formatDateTime(admin.grantedAt, locale)}
              </span>
            ) : null}
          </div>
        </div>

        {canManage ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => onStartEdit(admin)}
                className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-text)]"
              >
                {t.platformAdmins.editCredentials}
              </button>
            ) : null}
            {admin.canRevoke ? (
              <button
                type="button"
                disabled={revokingUserId === admin.userId}
                onClick={() => { void onRevoke(admin); }}
                className="rounded-md border border-[var(--admin-danger)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-danger)] disabled:opacity-50"
              >
                {revokingUserId === admin.userId
                  ? t.platformAdmins.revoking
                  : t.platformAdmins.revoke}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing && editDraft ? (
        <form
          onSubmit={(event) => { void onSaveCredentials(event, admin); }}
          className="grid gap-2 border-t border-[var(--admin-border)] pt-3 sm:grid-cols-2"
        >
          <label className="block space-y-1 text-xs sm:col-span-2">
            <span className="text-[var(--admin-muted)]">{t.common.name}</span>
            <input
              required
              value={editDraft.name}
              onChange={(event) => onEditDraftChange({ ...editDraft, name: event.target.value })}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="text-[var(--admin-muted)]">{t.platformAdmins.username}</span>
            <input
              dir="ltr"
              value={editDraft.username}
              onChange={(event) => onEditDraftChange({ ...editDraft, username: event.target.value })}
              placeholder={t.platformAdmins.usernameOptional}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="text-[var(--admin-muted)]">{t.platformAdmins.password}</span>
            <input
              type="password"
              dir="ltr"
              value={editDraft.password}
              onChange={(event) => onEditDraftChange({ ...editDraft, password: event.target.value })}
              placeholder={t.platformAdmins.passwordOptional}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isSavingCredentials}
              className="rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isSavingCredentials ? t.platformAdmins.savingCredentials : t.platformAdmins.saveCredentials}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)]"
            >
              {t.platformAdmins.cancelEdit}
            </button>
          </div>
        </form>
      ) : null}
    </AdminCard>
  );
}

export default function PlatformAdminsPage() {
  const { locale, t } = useSaasAdminLocale();
  const { can } = useSaasAdminSession();
  const canManage = can("platform-admins:write");
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  function formatPlatformRole(role: PlatformAdminRole) {
    return role === "owner" ? t.platformAdmins.roleOwner : t.platformAdmins.roleSupport;
  }

  async function refreshAdmins() {
    await queryClient.invalidateQueries({ queryKey: ["saas-admin", "platform-admins"] });
  }

  function startEdit(admin: PlatformAdminRow) {
    setEditingUserId(admin.userId);
    setEditDraft({
      name: admin.name,
      username: admin.username || "",
      password: "",
    });
    setFormError(null);
    setFormSuccess(null);
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditDraft(null);
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

  async function handleSaveCredentials(event: FormEvent<HTMLFormElement>, admin: PlatformAdminRow) {
    event.preventDefault();
    if (!editDraft) return;

    setFormError(null);
    setFormSuccess(null);
    setIsSavingCredentials(true);
    try {
      await updatePlatformAdminProfile(admin.userId, {
        name: editDraft.name.trim(),
        username: editDraft.username.trim() || undefined,
        password: editDraft.password || undefined,
      });
      cancelEdit();
      setFormSuccess(t.platformAdmins.credentialsUpdateSuccess);
      await refreshAdmins();
    } catch (credentialsError) {
      setFormError(
        credentialsError instanceof Error
          ? credentialsError.message
          : t.platformAdmins.credentialsUpdateError,
      );
    } finally {
      setIsSavingCredentials(false);
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

        {canManage ? (
          <AdminCard padding="md" className="max-w-3xl space-y-4">
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
        ) : null}

        <section className="max-w-3xl space-y-2">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            {t.platformAdmins.adminsListTitle}
          </h2>
          {admins.length === 0 ? (
            <AdminCard padding="md" className="text-center text-sm text-[var(--admin-muted)]">
              {t.common.noData}
            </AdminCard>
          ) : (
            admins.map((admin) => (
              <PlatformAdminListItem
                key={admin.userId}
                admin={admin}
                locale={locale}
                canManage={canManage}
                updatingRoleUserId={updatingRoleUserId}
                revokingUserId={revokingUserId}
                editingUserId={editingUserId}
                editDraft={editDraft}
                isSavingCredentials={isSavingCredentials}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onEditDraftChange={setEditDraft}
                onSaveCredentials={handleSaveCredentials}
                onRoleChange={handleRoleChange}
                onRevoke={handleRevoke}
                formatPlatformRole={formatPlatformRole}
                t={t}
              />
            ))
          )}
        </section>
      </AdminPageBody>
    </>
  );
}

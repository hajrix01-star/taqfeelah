"use client";

import { useState } from "react";
import { AddAccountMemberForm } from "@/features/saas-admin/client/AddAccountMemberForm";
import { EditAccountMemberForm } from "@/features/saas-admin/client/EditAccountMemberForm";
import { updateSaasAccountMember } from "@/features/saas-admin/client/saas-admin-api-client";
import { resolveSaasAdminFormError, type SaasAdminFormError } from "@/features/saas-admin/client/api-error";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminCompactTable, AdminCompactTableCell } from "@/features/saas-admin/components/AdminCompactTable";
import { AdminModal } from "@/features/saas-admin/components/AdminModal";
import {
  formatEntityStatus,
  formatMemberRole,
} from "@/features/saas-admin/components/admin-display-labels";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type StoreOption = {
  id: string;
  name: string;
};

type MemberRow = {
  memberId: string;
  userId: string;
  name: string;
  role: string;
  status: string;
};

type AccountTeamSectionProps = {
  organizationId: string;
  stores: StoreOption[];
  users: MemberRow[];
  onUpdated: () => void;
  readOnly?: boolean;
};

export function AccountTeamSection({
  organizationId,
  stores,
  users,
  onUpdated,
  readOnly = false,
}: AccountTeamSectionProps) {
  const { t } = useSaasAdminLocale();
  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<SaasAdminFormError | null>(null);

  async function handleToggleStatus(member: MemberRow) {
    const nextStatus = member.status === "inactive" ? "active" : "inactive";
    setToggleError(null);
    setTogglingMemberId(member.memberId);
    try {
      await updateSaasAccountMember(organizationId, member.memberId, { status: nextStatus });
      onUpdated();
    } catch (submitError) {
      setToggleError(resolveSaasAdminFormError(submitError, t, t.teamSection.toggleError));
    } finally {
      setTogglingMemberId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--admin-muted)]">
          {t.common.users}
          {" · "}
          {users.length}
        </p>
        {readOnly ? null : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t.addMember.submit}
          </button>
        )}
      </div>

      {toggleError ? (
        <AdminErrorAlert message={toggleError.message} cause={toggleError.cause} code={toggleError.code} />
      ) : null}

      <AdminCompactTable
        columns={[t.common.name, t.common.role, t.common.status, ""]}
        empty={users.length === 0}
        emptyMessage={t.common.noData}
      >
        {users.map((row) => (
          <tr key={row.memberId} className="hover:bg-[var(--admin-hover)]">
            <AdminCompactTableCell col={0} className="font-semibold text-[var(--admin-text)]">
              {row.name}
            </AdminCompactTableCell>
            <AdminCompactTableCell col={1}>{formatMemberRole(row.role, t)}</AdminCompactTableCell>
            <AdminCompactTableCell col={2}>{formatEntityStatus(row.status, t)}</AdminCompactTableCell>
            <AdminCompactTableCell col={3}>
              {!readOnly && row.role !== "owner" ? (
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingMember(row)}
                    className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
                  >
                    {t.accountDetails.editMember}
                  </button>
                  <button
                    type="button"
                    disabled={togglingMemberId === row.memberId}
                    onClick={() => { void handleToggleStatus(row); }}
                    className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] disabled:opacity-50"
                  >
                    {row.status === "inactive"
                      ? t.teamSection.activateMember
                      : t.teamSection.deactivateMember}
                  </button>
                </div>
              ) : (
                "—"
              )}
            </AdminCompactTableCell>
          </tr>
        ))}
      </AdminCompactTable>

      <AdminModal
        open={addOpen}
        title={t.addMember.title}
        onClose={() => setAddOpen(false)}
      >
        <AddAccountMemberForm
          organizationId={organizationId}
          stores={stores}
          onCreated={() => {
            setAddOpen(false);
            onUpdated();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </AdminModal>

      <EditAccountMemberForm
        organizationId={organizationId}
        member={editingMember}
        open={editingMember !== null}
        onClose={() => setEditingMember(null)}
        onUpdated={() => {
          setEditingMember(null);
          onUpdated();
        }}
      />
    </div>
  );
}

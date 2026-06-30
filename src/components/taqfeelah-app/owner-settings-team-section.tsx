"use client";

import { text } from "./taqfeelah-app-catalog-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import { SettingsPageHeader } from "./owner-settings-ui-primitives";
import { OwnerSettingsTeamRoster } from "./owner-settings-team-roster";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type {
  OwnerSettingsDeleteDialogProps,
  OwnerSettingsSectionCommonProps,
  AppBusiness,
} from "./taqfeelah-app-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";

export function OwnerSettingsTeamSection({
  lang,
  managingTeam,
  startManagingTeam,
  cancelManagingTeam,
  visibleStaff,
  employeeStoreIds,
  toggleEmployeeActive,
  setDeleteTarget,
  activeStoredBusinesses,
  displayBusinessName,
  toggleEmployeeStore,
  draftAuthEmployeePins,
  updateDraftEmployeePin,
  updateEmployeeMobile,
  newEmployeeName,
  setNewEmployeeName,
  newEmployeeMobile,
  setNewEmployeeMobile,
  newEmployeeStoreIds,
  toggleNewEmployeeStore,
  addStaff,
  teamSaving,
  saveManagingTeam,
  setSection,
  deleteDialogProps,
  orgConfigLoading = false,
  settingsNotice = "",
  embedded = false,
}: OwnerSettingsSectionCommonProps & {
  managingTeam: boolean;
  startManagingTeam: () => void;
  cancelManagingTeam: () => void;
  visibleStaff: StaffMember[];
  employeeStoreIds: (person: StaffMember) => string[];
  toggleEmployeeActive: (personId: string) => void;
  setDeleteTarget: (target: unknown) => void;
  activeStoredBusinesses: AppBusiness[];
  displayBusinessName: (business: AppBusiness) => string;
  toggleEmployeeStore: (personId: string, storeId: string) => void;
  draftAuthEmployeePins: Record<string, string>;
  updateDraftEmployeePin: (personId: string, pin: string) => void;
  updateEmployeeMobile: (personId: string, mobile: string) => void;
  newEmployeeName: string;
  setNewEmployeeName: (value: string) => void;
  newEmployeeMobile: string;
  setNewEmployeeMobile: (value: string) => void;
  newEmployeeStoreIds: string[];
  toggleNewEmployeeStore: (storeId: string) => void;
  addStaff: () => void;
  teamSaving: boolean;
  saveManagingTeam: () => void | Promise<void>;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  inviteApiContext?: Record<string, unknown> | null;
  orgConfigLoading?: boolean;
  settingsNotice?: string;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader
          title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"}
          onBack={() => { cancelManagingTeam(); setSection("home"); }}
          lang={lang}
        />
      ) : null}
      {settingsNotice ? (
        <div className="mb-4 rounded-xl bg-[var(--taq-color-fff1ee)] p-2.5 text-center text-taq-meta font-bold text-[var(--taq-color-b44747)]">{settingsNotice}</div>
      ) : null}
      {orgConfigLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[var(--taq-color-827762)] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جارٍ تحميل الفريق من السيرفر..." : "Loading team from server..."}
        </div>
      ) : (
        <>
        <OwnerSettingsTeamRoster
          lang={lang}
          managingTeam={managingTeam}
          startManagingTeam={startManagingTeam}
          cancelManagingTeam={cancelManagingTeam}
          visibleStaff={visibleStaff}
          employeeStoreIds={employeeStoreIds}
          toggleEmployeeActive={toggleEmployeeActive}
          setDeleteTarget={setDeleteTarget}
          activeStoredBusinesses={activeStoredBusinesses}
          displayBusinessName={displayBusinessName}
          toggleEmployeeStore={toggleEmployeeStore}
          draftAuthEmployeePins={draftAuthEmployeePins}
          updateDraftEmployeePin={updateDraftEmployeePin}
          updateEmployeeMobile={updateEmployeeMobile}
          newEmployeeName={newEmployeeName}
          setNewEmployeeName={setNewEmployeeName}
          newEmployeeMobile={newEmployeeMobile}
          setNewEmployeeMobile={setNewEmployeeMobile}
          newEmployeeStoreIds={newEmployeeStoreIds}
          toggleNewEmployeeStore={toggleNewEmployeeStore}
          addStaff={addStaff}
        />
      {managingTeam && (
        <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
          <button onClick={cancelManagingTeam} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
          <button type="button" disabled={teamSaving} onClick={() => { void saveManagingTeam(); }} className={`rounded-2xl py-3.5 text-xs font-black text-white ${teamSaving ? "bg-[var(--taq-color-b8c0b7)]" : "bg-[var(--taq-color-112a46)]"}`}>{text(lang, "saveTeamChanges")}</button>
        </div>
      )}
        </>
      )}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </SettingsSectionFrame>
  );
}

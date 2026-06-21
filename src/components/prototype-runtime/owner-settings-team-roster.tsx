"use client";

import { Trash2 } from "lucide-react";
import { StandardLoginPhoneField } from "@/core/phone/StandardLoginPhoneField";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import { buildStaffDeleteTarget } from "@/features/org-config/client/owner-settings-team-actions";
import { resolveStaffInviteUserKey } from "@/features/member-invitations/client/group-team-invitations";
import { SettingToggle } from "./OwnerSettingsSection";
import { OwnerSettingsStaffInviteLine } from "./owner-settings-staff-invite-line";
import { text } from "./prototype-runtime-demo-data";
import type { OwnerSettingsTeamRosterProps } from "./prototype-runtime-types";

export function OwnerSettingsTeamRoster({
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
  groupedInvites = null,
}: OwnerSettingsTeamRosterProps) {
  const usedInvitesByUserId = groupedInvites?.usedInvitesByUserId || null;

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
        <button
          type="button"
          onClick={() => (managingTeam ? cancelManagingTeam() : startManagingTeam())}
          className="text-taq-meta font-black text-[#9A823E]"
        >
          {text(lang, managingTeam ? "cancelChanges" : "configure")}
        </button>
      </div>
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {visibleStaff.map((person, index) => {
          const staffInvite = usedInvitesByUserId
            ? usedInvitesByUserId.get(resolveStaffInviteUserKey(person)) || null
            : null;

          return (
            <div key={person.id} className={`p-4 ${index < visibleStaff.length - 1 || managingTeam ? "border-b border-[#F0ECE2]" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p>
                  <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                    {person.active ? text(lang, "active") : text(lang, "stopChannel")} {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}
                  </p>
                  {person.mobile ? (
                    <p className="mt-1 text-taq-meta font-bold text-[#716753]" dir="ltr">
                      {text(lang, "employeeMobile")}: {formatLoginPhoneForDisplay(person.mobile)}
                    </p>
                  ) : (
                    <p className="mt-1 text-taq-meta font-bold text-[#B8A98E]">
                      {text(lang, "employeeMobileMissing")}
                    </p>
                  )}
                  <OwnerSettingsStaffInviteLine lang={lang} invite={staffInvite} />
                </div>
                <div className="flex items-center gap-2">
                  <SettingToggle disabled={!managingTeam} enabled={Boolean(person.active)} onToggle={() => toggleEmployeeActive(String(person.id))} />
                  {managingTeam && (
                    <button onClick={() => setDeleteTarget(buildStaffDeleteTarget(person) as Parameters<typeof setDeleteTarget>[0])} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {managingTeam && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeStoredBusinesses.map((business) => (
                      <button key={business.id} onClick={() => toggleEmployeeStore(person.id, business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${employeeStoreIds(person).includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                        {displayBusinessName(business)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-black text-[#716753]">{text(lang, "employeeMobile")}</p>
                    <StandardLoginPhoneField
                      surface="owner"
                      value={person.mobile || ""}
                      onChange={(nextValue) => updateEmployeeMobile(person.id, nextValue)}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-black text-[#716753]">{lang === "ar" ? "الرقم السري للموظف" : "Employee PIN"}</p>
                    <input
                      dir="ltr"
                      value={draftAuthEmployeePins?.[person.id] || ""}
                      onChange={(event) => updateDraftEmployeePin(person.id, event.target.value)}
                      placeholder={
                        person.pinConfigured && !draftAuthEmployeePins?.[person.id]
                          ? (lang === "ar" ? "مُعرَّف — أدخل PIN جديدًا للتغيير" : "Set — enter a new PIN to change")
                          : (lang === "ar" ? "PIN أو كلمة مرور قصيرة" : "PIN or short passcode")
                      }
                      className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
        {managingTeam && (
          <div className="p-4">
            <p className="mb-3 text-xs font-black">{text(lang, "addEmployee")}</p>
            <input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder={text(lang, "newEmployeeName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
            <div className="mb-3">
              <p className="mb-2 text-xs font-black text-[#716753]">{text(lang, "employeeMobile")}</p>
              <StandardLoginPhoneField
                surface="owner"
                value={newEmployeeMobile}
                onChange={setNewEmployeeMobile}
              />
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {activeStoredBusinesses.map((business) => (
                <button key={business.id} onClick={() => toggleNewEmployeeStore(business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${newEmployeeStoreIds.includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                  {displayBusinessName(business)}
                </button>
              ))}
            </div>
            <button disabled={!newEmployeeName.trim() || !newEmployeeStoreIds.length} onClick={addStaff} className={`w-full rounded-2xl py-3 text-xs font-black text-white ${newEmployeeName.trim() && newEmployeeStoreIds.length ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>
              {text(lang, "addEmployee")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

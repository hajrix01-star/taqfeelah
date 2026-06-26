"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { StandardLoginPhoneField } from "@/core/phone/StandardLoginPhoneField";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import { buildStaffDeleteTarget } from "@/features/org-config/client/owner-settings-team-actions";
import { SettingToggle } from "./OwnerSettingsSection";
import { text } from "./taqfeelah-app-reference-data";
import type { OwnerSettingsTeamRosterProps } from "./taqfeelah-app-types";

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
}: OwnerSettingsTeamRosterProps) {
  const [expandedStaffId, setExpandedStaffId] = useState("");
  const activeStaffCount = useMemo(
    () => visibleStaff.filter((person) => Boolean(person.active)).length,
    [visibleStaff],
  );
  const inactiveStaffCount = Math.max(visibleStaff.length - activeStaffCount, 0);

  useEffect(() => {
    if (!expandedStaffId) return;
    if (!visibleStaff.some((person) => String(person.id) === expandedStaffId)) {
      setExpandedStaffId("");
    }
  }, [expandedStaffId, visibleStaff]);

  const formatAssignedStores = (person: (typeof visibleStaff)[number]) => {
    const assignedIds = employeeStoreIds(person);
    return activeStoredBusinesses
      .filter((business) => assignedIds.includes(business.id))
      .map((business) => displayBusinessName(business))
      .join("، ") || "—";
  };

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
          <p className="mt-1 text-[10px] font-bold text-[#827762]">
            {visibleStaff.length} {lang === "ar" ? "موظف" : "employees"}
            {" · "}
            {activeStaffCount} {text(lang, "active")}
            {inactiveStaffCount ? ` · ${inactiveStaffCount} ${text(lang, "stopChannel")}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (managingTeam ? cancelManagingTeam() : startManagingTeam())}
          className="shrink-0 text-taq-meta font-black text-[#9A823E]"
        >
          {text(lang, managingTeam ? "cancelChanges" : "configure")}
        </button>
      </div>

      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {visibleStaff.length ? visibleStaff.map((person, index) => {
          const personId = String(person.id);
          const expanded = expandedStaffId === personId;
          const assignedStoreCount = employeeStoreIds(person).length;

          return (
            <div key={person.id} className={`p-4 ${index < visibleStaff.length - 1 || managingTeam ? "border-b border-[#F0ECE2]" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedStaffId(expanded ? "" : personId)}
                  className="min-w-0 flex-1 text-start"
                >
                  <p className="truncate text-sm font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p>
                  <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                    {person.active ? text(lang, "active") : text(lang, "stopChannel")} · {assignedStoreCount} {lang === "ar" ? "محل" : "shop(s)"}
                  </p>
                  {!expanded ? (
                    person.mobile ? (
                      <p className="mt-1 text-taq-meta font-bold text-[#716753]" dir="ltr">
                        {text(lang, "employeeMobile")}: {formatLoginPhoneForDisplay(person.mobile)}
                      </p>
                    ) : (
                      <p className="mt-1 text-taq-meta font-bold text-[#B8A98E]">
                        {text(lang, "employeeMobileMissing")}
                      </p>
                    )
                  ) : null}
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <SettingToggle disabled={!managingTeam} enabled={Boolean(person.active)} onToggle={() => toggleEmployeeActive(personId)} />
                  {managingTeam ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(buildStaffDeleteTarget(person) as Parameters<typeof setDeleteTarget>[0])}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setExpandedStaffId(expanded ? "" : personId)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F5EF] text-[#806528]"
                    aria-label={expanded ? "Collapse employee" : "Expand employee"}
                  >
                    <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="mt-3 rounded-2xl bg-[#F7F5EF] p-3">
                  {!managingTeam ? (
                    <div className="text-taq-meta font-bold text-[#716753]">
                      <p>
                        {text(lang, "employeeMobile")}:{" "}
                        {person.mobile ? formatLoginPhoneForDisplay(person.mobile) : text(lang, "employeeMobileMissing")}
                      </p>
                      <p className="mt-1">{lang === "ar" ? "المحلات" : "Stores"}: {formatAssignedStores(person)}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {activeStoredBusinesses.map((business) => (
                          <button
                            key={business.id}
                            type="button"
                            onClick={() => toggleEmployeeStore(person.id, business.id)}
                            className={`rounded-full px-3 py-2 text-taq-meta font-bold ${employeeStoreIds(person).includes(business.id) ? "bg-[#112A46] text-white" : "bg-white text-[#827762] ring-1 ring-[#E8E1D4]"}`}
                          >
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
                              ? (lang === "ar" ? "مُعرّف — أدخل PIN جديدًا للتغيير" : "Set — enter a new PIN to change")
                              : (lang === "ar" ? "PIN أو كلمة مرور قصيرة" : "PIN or short passcode")
                          }
                          className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black outline-none ring-1 ring-[#E8E1D4]"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        }) : (
          <p className="p-5 text-center text-xs font-bold text-[#827762]">
            {lang === "ar" ? "لا يوجد موظفون بعد." : "No employees yet."}
          </p>
        )}

        {managingTeam ? (
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
                <button key={business.id} type="button" onClick={() => toggleNewEmployeeStore(business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${newEmployeeStoreIds.includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                  {displayBusinessName(business)}
                </button>
              ))}
            </div>
            <button type="button" disabled={!newEmployeeName.trim() || !newEmployeeStoreIds.length} onClick={addStaff} className={`w-full rounded-2xl py-3 text-xs font-black text-white ${newEmployeeName.trim() && newEmployeeStoreIds.length ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>
              {text(lang, "addEmployee")}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

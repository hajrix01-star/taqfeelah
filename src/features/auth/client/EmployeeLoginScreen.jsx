"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import { text } from "@/i18n/text";
import { isProductionAppMode } from "@/core/config/app-mode";
import {
  fetchEmployeeLoginRosterViaApi,
  loginEmployeeSessionViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import {
  readEmployeeCredentials,
  saveEmployeeCredentials,
  clearEmployeeCredentials,
} from "@/features/demo/login-credentials-storage";

const APP_IN_PRODUCTION_MODE = isProductionAppMode();

const PRODUCTION_EMPLOYEE_LOGIN_STAFF = [
  { id: "ahmed", nameAr: "أحمد", nameEn: "Ahmed", mobile: "", active: true, removed: false, storeIds: ["shami"], apiUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79" },
  { id: "sara", nameAr: "سارة", nameEn: "Sara", mobile: "", active: true, removed: false, storeIds: ["shami"], apiUserId: "85f696d6-f655-4f2d-9f56-1f13c2f4c66c" },
];

export default function EmployeeLoginScreen({ lang, setLang, staff = [], onBack, onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rosterStaff, setRosterStaff] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(APP_IN_PRODUCTION_MODE);
  const loginStaff = APP_IN_PRODUCTION_MODE
    ? (staff.filter((person) => person.active && !person.removed).length > 0 ? staff : rosterStaff)
    : staff;
  const activeStaff = loginStaff.filter((person) => person.active && !person.removed);
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchEmployeeLoginRosterViaApi()
      .then((payload) => {
        if (cancelled) return;
        if (Array.isArray(payload?.staff)) {
          setRosterStaff(payload.staff.map((person) => ({
            ...person,
            active: true,
            removed: false,
          })));
        }
      })
      .catch((failure) => {
        if (cancelled) return;
        console.warn("employee roster load failed", failure);
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!selectedId && activeStaff[0]) setSelectedId(activeStaff[0].id);
  }, [activeStaff, selectedId]);
  useEffect(() => {
    const saved = readEmployeeCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.employeeId && activeStaff.some((person) => person.id === saved.employeeId)) setSelectedId(saved.employeeId);
    else if (saved.employeeId) setManualEmployeeId(saved.employeeId);
    if (saved.pin) setPin(saved.pin);
  }, [activeStaff]);
  const submit = async () => {
    if (submitting) return;
    const employeeIdentifier = activeStaff.length > 0 ? selectedId : manualEmployeeId.trim();
    const person = activeStaff.find((item) => item.id === employeeIdentifier);
    if (!employeeIdentifier) { setError(text(lang, "noActiveEmployee")); return; }
    if (APP_IN_PRODUCTION_MODE) {
      setSubmitting(true);
      try {
        const session = await loginEmployeeSessionViaApi({
          employeeId: employeeIdentifier,
          pin: pin.trim(),
        });
        onLogin(person?.id || employeeIdentifier, typeof session?.userId === "string" ? session.userId : "");
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidEmployeePin");
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    } else if (!person || !employeePinMatches(person, pin)) { setError(text(lang, "invalidEmployeePin")); return; }
    setError("");
    if (rememberMe) saveEmployeeCredentials({ employeeId: employeeIdentifier, pin: pin.trim() });
    else clearEmployeeCredentials();
    if (!APP_IN_PRODUCTION_MODE) onLogin(person?.id || employeeIdentifier);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[800px] flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "employeeLogin")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "employeeLoginSubtitle")}</p>
      </div>
      <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employee")}</p>
        {activeStaff.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeStaff.map((person) => (
              <button key={person.id} type="button" onClick={() => setSelectedId(person.id)} className={`rounded-full px-3 py-2 text-taq-meta font-black ${selectedId === person.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}>
                {lang === "ar" ? person.nameAr : person.nameEn}
              </button>
            ))}
          </div>
        ) : rosterLoading ? (
          <p className="mb-4 rounded-2xl bg-[#F7F5EF] px-4 py-3 text-center text-taq-meta font-bold text-[#827762]">
            {lang === "ar" ? "جاري تحميل قائمة الموظفين..." : "Loading employee list..."}
          </p>
        ) : (
          <input
            dir="ltr"
            value={manualEmployeeId}
            onChange={(event) => setManualEmployeeId(event.target.value)}
            placeholder={lang === "ar" ? "Employee ID" : "Employee ID"}
            className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
          />
        )}
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employeePin")}</p>
        <input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="• • • •" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
        {!APP_IN_PRODUCTION_MODE ? <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "employeePinHint")}</p> : null}
        <label className="mt-3 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
          />
          <span className="text-taq-meta font-black text-[#716753]">{text(lang, "rememberMe")}</span>
        </label>
        <button type="button" onClick={() => { void submit(); }} disabled={submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>}
      </div>
      <button type="button" onClick={onBack} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "backToOwnerLogin")}</button>
    </motion.section>
  );
}

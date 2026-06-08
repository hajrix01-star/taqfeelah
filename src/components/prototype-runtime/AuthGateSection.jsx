"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import LanHintBanner from "@/features/demo/LanHintBanner";
import {
  clearEmployeeCredentials,
  clearOwnerCredentials,
  readEmployeeCredentials,
  readOwnerCredentials,
  saveEmployeeCredentials,
  saveOwnerCredentials,
} from "@/features/demo/login-credentials-storage";
import { getEnabledOwnerLoginMethods, isOwnerLoginMethodEnabled } from "@/core/auth/owner-login-methods";
import {
  employeePinMatches,
  filterActiveLoginStaff,
  normalizeEmployeeLoginRosterStaff,
  resolveEmployeeLoginStaff,
} from "@/features/employee-closeouts/employee-portal-session";
import { fetchEmployeeLoginRosterViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import {
  loginEmployeeViaSessionBridge,
  loginOwnerViaSessionBridge,
  readSessionBootState,
} from "@/features/auth/client/session-bridge";
import { text } from "./prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
  PROTOTYPE_ACCESS_MODE,
  PROTOTYPE_DEFAULT_STAFF,
  PROTOTYPE_DEMO_OTP,
  PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
  PROTOTYPE_OWNER_PASSWORD,
  PROTOTYPE_OWNER_USERNAME,
  readSavedSettings,
} from "./prototype-runtime-boot";
import { LanguageSwitch, Logo } from "./prototype-runtime-chrome";
import { openWhatsAppSupport } from "./prototype-runtime-support";

function LoginScreen({ lang, setLang, onOwnerLogin, onEmployeePortal }) {
  const ownerLoginMethods = getEnabledOwnerLoginMethods();
  const [method, setMethod] = useState(
    ownerLoginMethods.includes("whatsapp_otp") ? "phone" : "password",
  );
  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(PROTOTYPE_OWNER_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  useEffect(() => {
    const saved = readOwnerCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.username) setUsername(saved.username);
    if (saved.password) setPassword(saved.password);
  }, []);
  const submitOtp = () => {
    if (`${code}`.trim() !== PROTOTYPE_DEMO_OTP) { setError(text(lang, "invalidOtp")); return; }
    setError("");
    onOwnerLogin();
  };
  const submitPassword = async () => {
    if (submitting) return;
    if (APP_IN_PRODUCTION_MODE) {
      setSubmitting(true);
      try {
        const session = await loginOwnerViaSessionBridge({
          username: username.trim(),
          password,
          useServerAuth: APP_IN_PRODUCTION_MODE,
        });
        onOwnerLogin(typeof session?.userId === "string" ? session.userId : "");
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidCredentials");
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    } else if (username.trim().toLowerCase() !== PROTOTYPE_OWNER_USERNAME || password !== PROTOTYPE_OWNER_PASSWORD) {
      setError(text(lang, "invalidCredentials"));
      return;
    }
    setError("");
    if (rememberMe) saveOwnerCredentials({ username: username.trim(), password });
    else clearOwnerCredentials();
    if (!APP_IN_PRODUCTION_MODE) onOwnerLogin();
  };
  useEffect(() => {
    if (method === "phone" && !isOwnerLoginMethodEnabled("whatsapp_otp")) {
      setMethod("password");
    }
  }, [method]);
  const canUsePhoneOtp = isOwnerLoginMethodEnabled("whatsapp_otp");
  const canUsePassword = isOwnerLoginMethodEnabled("username_password");
  const showAuthMethodTabs = canUsePhoneOtp && canUsePassword;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[800px] flex-col px-6 pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "loginTitle")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "loginSubtitle")}</p>
      </div>
      {showAuthMethodTabs ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setMethod("phone"); setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${method === "phone" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPhone")}</button>
          <button type="button" onClick={() => { setMethod("password"); setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${method === "password" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPassword")}</button>
        </div>
      ) : null}
      <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        {method === "phone" && canUsePhoneOtp ? (
          stage === "phone" ? (
            <>
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "mobileNumber")}</p>
              <div dir="ltr" className="flex items-center gap-3 rounded-2xl bg-[#F7F5EF] px-4 py-4 ring-1 ring-[#E8E1D4]">
                <Smartphone className="h-5 w-5 text-[#B99844]" />
                <span className="border-r border-[#DDD3C0] pr-3 text-sm font-black text-[#112A46]">+966</span>
                <input
                  value={phone}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
                />
              </div>
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "mobileHint")}</p>
              <button type="button" onClick={() => { setStage("code"); setError(""); }} className="mt-5 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white">{text(lang, "sendCode")}</button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#716753]">{text(lang, "verificationCode")}</p>
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "codeSentTo")} <span dir="ltr" className="text-[#112A46]">+966 {phone}</span></p>
              <input
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="â€¢ â€¢ â€¢ â€¢"
                className="mt-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]"
              />
              <button type="button" onClick={submitOtp} className="mt-5 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white">{text(lang, "verifyContinue")}</button>
              <button type="button" onClick={() => { setStage("phone"); setError(""); }} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "changeNumber")}</button>
            </>
          )
        ) : (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "username")}</p>
            <input dir="ltr" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "password")}</p>
            <input dir="ltr" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
              />
              <span className="text-taq-meta font-black text-[#716753]">{text(lang, "rememberMe")}</span>
            </label>
            <button type="button" onClick={() => { void submitPassword(); }} disabled={submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
          </>
        )}
        {error && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>}
      </div>
      <button type="button" onClick={onEmployeePortal} className="mt-4 w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "employeeLogin")}</button>
      {!APP_IN_PRODUCTION_MODE ? <LanHintBanner lang={lang} /> : null}
      {!APP_IN_PRODUCTION_MODE ? (
        <div className="mt-4 rounded-2xl bg-[#FFF4D2] p-4 text-center">
          <p className="text-taq-meta font-black leading-5 text-[#806528]">{text(lang, "prototypeDemoAccess")}</p>
          <p className="mt-1 text-taq-meta font-bold text-[#957D43]">{text(lang, "linkedAccountNote")}</p>
          <p className="mt-2 border-t border-[#E4C66B]/45 pt-2 text-taq-meta font-bold text-[#957D43]">{text(lang, "futureLoginOnLoginScreen")}</p>
        </div>
      ) : null}
      {!APP_IN_PRODUCTION_MODE ? (
        <p className="mt-3 text-center text-taq-meta font-bold text-[#827762]">
          {text(lang, "prototypeBuildLabel")}: <span dir="ltr" className="font-black text-[#112A46]">{PROTOTYPE_BUILD_STAMP}</span>
        </p>
      ) : null}
    </motion.section>
  );
}

function EmployeeLoginScreen({ lang, setLang, staff = [], onBack, onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rosterStaff, setRosterStaff] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(APP_IN_PRODUCTION_MODE);
  const loginStaff = resolveEmployeeLoginStaff(staff, rosterStaff, APP_IN_PRODUCTION_MODE);
  const activeStaff = filterActiveLoginStaff(loginStaff);
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchEmployeeLoginRosterViaApi()
      .then((payload) => {
        if (cancelled) return;
        if (Array.isArray(payload?.staff)) {
          setRosterStaff(normalizeEmployeeLoginRosterStaff(payload));
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
        const session = await loginEmployeeViaSessionBridge({
          employeeId: employeeIdentifier,
          pin: pin.trim(),
          useServerAuth: APP_IN_PRODUCTION_MODE,
        });
        onLogin(person?.id || employeeIdentifier, typeof session?.userId === "string" ? session.userId : "", person || null);
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidEmployeePin");
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
    } else if (!person || !employeePinMatches(person, pin, PROTOTYPE_EMPLOYEE_PIN_DEFAULT)) { setError(text(lang, "invalidEmployeePin")); return; }
    setError("");
    if (rememberMe) saveEmployeeCredentials({ employeeId: employeeIdentifier, pin: pin.trim() });
    else clearEmployeeCredentials();
    if (!APP_IN_PRODUCTION_MODE) onLogin(person?.id || employeeIdentifier, "", person || null);
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
        <input dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="â€¢ â€¢ â€¢ â€¢" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
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

function HelpCenterSheet({ lang, open, onClose }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6">
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="relative z-10 w-full max-w-md rounded-t-[28px] bg-[#F8F6F0] p-5 sm:rounded-[28px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black">{text(lang, "helpCenterTitle")}</h3>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "helpCenterBody")}</p>
          {!APP_IN_PRODUCTION_MODE ? (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">
              {text(lang, "prototypeBuildLabel")}: <span dir="ltr">{PROTOTYPE_BUILD_STAMP}</span>
            </p>
          ) : null}
          {!APP_IN_PRODUCTION_MODE ? <LanHintBanner lang={lang} /> : null}
          <button type="button" onClick={() => { openWhatsAppSupport(lang); onClose(); }} className="mt-4 w-full rounded-2xl bg-[#25D366] py-3.5 text-xs font-black text-white">{text(lang, "whatsappSupport")}</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function readPrototypeAuthBoot() {
  return readSessionBootState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
    readSavedSettings,
    defaultStaff: PROTOTYPE_DEFAULT_STAFF,
  });
}


export { LoginScreen, EmployeeLoginScreen, HelpCenterSheet, readPrototypeAuthBoot };

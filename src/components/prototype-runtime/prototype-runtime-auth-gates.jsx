"use client";

import PrototypeAccessScreen from "@/features/demo/PrototypeAccessScreen";
import { PROTOTYPE_ACCESS_MODE } from "./prototype-runtime-boot";
import {
  EmployeeLoginScreen,
  LoginScreen,
} from "./AuthGateSection";
import { AppFontStyles } from "./prototype-runtime-app-font-styles";

export function PrototypeRuntimeLoggedOutGate({
  lang,
  setLang,
  authScreen,
  setAuthScreen,
  staff,
  onOwnerLogin,
  onEmployeeLogin,
  onEnterAsOwner,
  onEnterAsEmployee,
}) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      {PROTOTYPE_ACCESS_MODE ? (
        <PrototypeAccessScreen
          lang={lang}
          setLang={setLang}
          onOwner={onEnterAsOwner}
          onEmployee={onEnterAsEmployee}
        />
      ) : authScreen === "owner" ? (
        <LoginScreen
          lang={lang}
          setLang={setLang}
          onOwnerLogin={onOwnerLogin}
          onEmployeePortal={() => setAuthScreen("employee")}
        />
      ) : (
        <EmployeeLoginScreen
          lang={lang}
          setLang={setLang}
          staff={staff}
          onBack={() => setAuthScreen("owner")}
          onLogin={onEmployeeLogin}
        />
      )}
    </div>
  );
}

export function PrototypeRuntimeOrgLoadingGate({ lang }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]">
      <AppFontStyles />
      <p className="text-center text-sm font-bold text-[#827762]">
        {lang === "ar" ? "جاري تحميل بيانات المنشأة من قاعدة البيانات..." : "Loading organization data from database..."}
      </p>
    </div>
  );
}

export function PrototypeRuntimeOrgErrorGate({ lang, orgConfigSyncError }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]">
      <AppFontStyles />
      <div className="max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-black/[0.045]">
        <p className="text-sm font-black text-[#B44747]">
          {lang === "ar" ? "تعذر تحميل بيانات المنشأة" : "Failed to load organization data"}
        </p>
        <p className="mt-2 text-taq-meta font-bold text-[#827762]">{orgConfigSyncError}</p>
      </div>
    </div>
  );
}

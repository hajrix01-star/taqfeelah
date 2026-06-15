"use client";

import {
  AuthGatewayScreen,
  EmployeeLoginScreen,
  LoginScreen,
  OwnerPasswordChangeScreen,
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
}) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      {authScreen === "gateway" ? (
        <AuthGatewayScreen
          lang={lang}
          setLang={setLang}
          onOwnerPortal={() => setAuthScreen("owner")}
          onEmployeePortal={() => setAuthScreen("employee")}
        />
      ) : authScreen === "owner" ? (
        <LoginScreen
          lang={lang}
          setLang={setLang}
          onOwnerLogin={onOwnerLogin}
          onBack={() => setAuthScreen("gateway")}
        />
      ) : (
        <EmployeeLoginScreen
          lang={lang}
          setLang={setLang}
          staff={staff}
          onBack={() => setAuthScreen("gateway")}
          onLogin={onEmployeeLogin}
        />
      )}
    </div>
  );
}

export function PrototypeRuntimeOrgLoadingGate({ lang }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <p className="text-center text-sm font-bold text-[#827762]">
        {lang === "ar" ? "جاري تحميل بيانات المنشأة من قاعدة البيانات..." : "Loading organization data from database..."}
      </p>
    </div>
  );
}

export function PrototypeRuntimeOwnerPasswordGate({
  lang,
  setLang,
  onComplete,
  onLogout,
}) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <OwnerPasswordChangeScreen
        lang={lang}
        setLang={setLang}
        onComplete={onComplete}
        onLogout={onLogout}
      />
    </div>
  );
}

export function PrototypeRuntimeOrgErrorGate({ lang, orgConfigSyncError }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] font-sans text-[#112A46]">
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

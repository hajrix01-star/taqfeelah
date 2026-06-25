"use client";

import {
  AuthGatewayScreen,
  EmployeeLoginScreen,
  LoginScreen,
  OwnerPasswordChangeScreen,
} from "./AuthGateSection";
import { AppFontStyles } from "./taqfeelah-app-font-styles";
import type {
  PrototypeAuthScreen,
  PrototypeLang,
  TaqfeelahAppCallback,
  PrototypeStaffMember,
} from "./taqfeelah-app-types";

type TaqfeelahAppLoggedOutGateProps = {
  lang: PrototypeLang;
  setLang: (lang: PrototypeLang) => void;
  authScreen: PrototypeAuthScreen;
  setAuthScreen: (screen: PrototypeAuthScreen) => void;
  staff: PrototypeStaffMember[];
  onOwnerLogin: TaqfeelahAppCallback;
  onEmployeeLogin: TaqfeelahAppCallback;
};

export function TaqfeelahAppLoggedOutGate({
  lang,
  setLang,
  authScreen,
  setAuthScreen,
  staff,
  onOwnerLogin,
  onEmployeeLogin,
}: TaqfeelahAppLoggedOutGateProps) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
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

export function TaqfeelahAppOrgLoadingGate({ lang }: { lang: PrototypeLang }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <p className="text-center text-sm font-bold text-[#827762]">
        {lang === "ar" ? "ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†ط´ط£ط© ظ…ظ† ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ..." : "Loading organization data from database..."}
      </p>
    </div>
  );
}

type TaqfeelahAppOwnerPasswordGateProps = {
  lang: PrototypeLang;
  setLang: (lang: PrototypeLang) => void;
  onComplete: () => void;
  onLogout: () => void;
};

export function TaqfeelahAppOwnerPasswordGate({
  lang,
  setLang,
  onComplete,
  onLogout,
}: TaqfeelahAppOwnerPasswordGateProps) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
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

export function TaqfeelahAppOrgErrorGate({
  lang,
  orgConfigSyncError,
}: {
  lang: PrototypeLang;
  orgConfigSyncError?: string | null;
}) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <div className="max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-black/[0.045]">
        <p className="text-sm font-black text-[#B44747]">
          {lang === "ar" ? "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†ط´ط£ط©" : "Failed to load organization data"}
        </p>
        <p className="mt-2 text-taq-meta font-bold text-[#827762]">{orgConfigSyncError}</p>
      </div>
    </div>
  );
}

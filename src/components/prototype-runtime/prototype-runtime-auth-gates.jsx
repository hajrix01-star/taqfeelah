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

"use client";

import React from "react";

import {
  AuthGatewayScreen,
  EmployeeLoginScreen,
  LoginScreen,
  OwnerPasswordChangeScreen,
} from "./AuthGateSection";
import { AppFontStyles } from "./taqfeelah-app-font-styles";
import type {
  AppAuthScreen,
  AppLang,
  TaqfeelahAppCallback,
  AppStaffMember,
} from "./taqfeelah-app-types";

type TaqfeelahAppLoggedOutGateProps = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  authScreen: AppAuthScreen;
  setAuthScreen: (screen: AppAuthScreen) => void;
  staff: AppStaffMember[];
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
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-app-root min-h-[100dvh] bg-[var(--taq-color-f8f6f0)] font-sans text-[var(--taq-color-112a46)]">
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

export function TaqfeelahAppOrgLoadingGate({ lang }: { lang: AppLang }) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[var(--taq-color-f8f6f0)] font-sans text-[var(--taq-color-112a46)]">
      <AppFontStyles />
      <p className="text-center text-sm font-bold text-[var(--taq-color-827762)]">
        {lang === "ar" ? "جاري تحميل بيانات المنشأة من قاعدة البيانات..." : "Loading organization data from database..."}
      </p>
    </div>
  );
}

type TaqfeelahAppOwnerPasswordGateProps = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
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
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-app-root min-h-[100dvh] bg-[var(--taq-color-f8f6f0)] font-sans text-[var(--taq-color-112a46)]">
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
  lang: AppLang;
  orgConfigSyncError?: string | null;
}) {
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-page-gutter flex min-h-[100dvh] items-center justify-center bg-[var(--taq-color-f8f6f0)] font-sans text-[var(--taq-color-112a46)]">
      <AppFontStyles />
      <div className="max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-black/[0.045]">
        <p className="text-sm font-black text-[var(--taq-color-b44747)]">
          {lang === "ar" ? "تعذر تحميل بيانات المنشأة" : "Failed to load organization data"}
        </p>
        <p className="mt-2 text-taq-meta font-bold text-[var(--taq-color-827762)]">{orgConfigSyncError}</p>
      </div>
    </div>
  );
}

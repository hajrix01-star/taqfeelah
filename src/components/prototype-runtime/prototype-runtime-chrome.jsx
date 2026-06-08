"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Plus,
  ReceiptText,
  Settings,
  UserRound,
} from "lucide-react";
import EmployeeFooterNav from "@/features/employee-closeouts/EmployeeFooterNav";
import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import { text } from "./prototype-runtime-demo-data";

const TAQFEELAH_LOGO_PNG = "data:image/png;base64,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";

function Logo({ compact = false, centered = false }) {
  return (
    <div className={`shrink-0 ${centered ? "flex justify-center" : "flex items-center"}`}>
      <img
        src={TAQFEELAH_LOGO_PNG}
        alt="تقفيلة - TAQFEELAH"
        draggable={false}
        className={`select-none object-contain ${compact ? "h-[44px] w-[132px]" : "h-[68px] w-[176px]"}`}
      />
    </div>
  );
}

function LanguageSwitch({ lang, setLang }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05]">
      <button onClick={() => setLang("ar")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>ع</button>
      <button onClick={() => setLang("en")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>EN</button>
    </div>
  );
}

function BackTitle({ title, onBack, lang, inNotebook = false }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return <div className={`mb-5 flex items-center gap-3 ${inNotebook ? "" : "px-5"}`}><button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"><BackIcon className="h-5 w-5" /></button><h2 className="text-xl font-black">{title}</h2></div>;
}

function TopBar({
  lang,
  setLang,
  employee,
  employeeName = "",
  onRoleChange,
  onLogout = () => {},
  onNotifications = () => {},
  onEmployeeSettings = () => {},
  showNotifications = true,
  hasNotificationBadge = false,
  notebookMode = false,
  notebookTheme = "yellow",
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOutside = (event) => { if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setAccountMenuOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setAccountMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [accountMenuOpen]);
  const headerSurfaceStyle = notebookMode ? notebookLinesBackground(notebookTheme) : { backgroundColor: "#F8F6F0" };
  const headerStyle = {
    ...headerSurfaceStyle,
    minHeight: "calc(70px + env(safe-area-inset-top, 0px))",
    paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
  };
  return (
    <header dir="ltr" className="taq-topbar sticky top-0 z-40 shrink-0 px-5 pb-2" style={headerStyle}>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "left-[14px]" : "right-[14px]"}`}>
        {!employee && showNotifications && (
          <button onClick={onNotifications} className="relative flex h-9 w-9 items-center justify-center text-[#112A46]">
            <Bell className="h-5 w-5" />
            {hasNotificationBadge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#CE4642]" />}
          </button>
        )}
      </div>
      <div className="absolute left-1/2 top-[calc(12px+env(safe-area-inset-top,0px))] -translate-x-1/2 text-center">
        <Logo compact centered />
        {employee && employeeName ? (
          <p className="mx-auto mt-0.5 max-w-[160px] truncate text-taq-meta font-extrabold text-[#716753]">{employeeName}</p>
        ) : null}
      </div>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "right-[36px]" : "left-[36px]"}`}>
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label={text(lang, "account")}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[#112A46] transition ${accountMenuOpen ? "text-[#9A823E]" : ""}`}
          >
            <UserRound className="h-[21px] w-[21px]" strokeWidth={2} />
          </button>
          <AnimatePresence>
            {accountMenuOpen && (
              <motion.div
                dir={lang === "ar" ? "rtl" : "ltr"}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                role="menu"
                className={`absolute top-[44px] z-50 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.06] ${employee ? "w-[148px]" : "w-[126px]"} ${lang === "ar" ? "right-0" : "left-0"}`}
              >
                <div className="flex justify-center px-1 py-1.5"><LanguageSwitch lang={lang} setLang={setLang} /></div>
                {employee ? (
                  <>
                    <div className="my-1 border-t border-[#F0ECE2]" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setAccountMenuOpen(false); onEmployeeSettings(); }}
                      className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#112A46] transition hover:bg-[#F7F5EF]"
                    >
                      {text(lang, "settings")}
                    </button>
                  </>
                ) : null}
                <div className="my-1 border-t border-[#F0ECE2]" />
                <button role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#B44747] transition hover:bg-[#FFF1EE]">
                  <span>{text(lang, "logout")}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }) {
  const NavButton = ({ item }) => {
    const Icon = item.icon;
    return (
      <button onClick={() => onChange(item.id)} className={`flex min-w-[60px] flex-col items-center gap-0.5 text-taq-nav font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}>
        <Icon className="h-4.5 w-4.5" />
        {text(lang, item.key)}
      </button>
    );
  };
  if (employee) {
    return <EmployeeFooterNav lang={lang} onAdd={onAdd} />;
  }
  const leftItems = [{ id: "home", key: "home", icon: Home }, { id: "reports", key: "reports", icon: FileText }];
  const rightItems = [{ id: "register", key: "register", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-[122px] items-center justify-between">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className="absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"><Plus className="h-7 w-7" strokeWidth={2.4} /></button>
      <div className="w-[52px]" />
      <div className="flex w-[122px] items-center justify-between">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
}

export { Logo, LanguageSwitch, BackTitle, TopBar, BottomNav };

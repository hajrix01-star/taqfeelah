"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  ReceiptText,
  Settings,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EmployeeFooterNav from "@/features/employee-closeouts/EmployeeFooterNav";
import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import { AppBrandMark } from "@/lib/brand/AppBrandMark";
import { text } from "./taqfeelah-app-demo-data";
import { taqInteractive } from "@/core/ui/interactive-classes";
import type { NotebookThemeId, PrototypeLang } from "./taqfeelah-app-types";

function Logo({ compact = false, centered = false, showTagline = false }: {
  compact?: boolean;
  centered?: boolean;
  showTagline?: boolean;
}) {
  return (
    <div className={`shrink-0 ${centered ? "flex justify-center" : "flex items-center"}`}>
      <AppBrandMark compact={compact} showTagline={showTagline} />
    </div>
  );
}

function LanguageSwitch({ lang, setLang }: {
  lang: PrototypeLang;
  setLang: (lang: PrototypeLang) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05]">
      <button type="button" onClick={() => setLang("ar")} className={`${taqInteractive.chip} rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>ع</button>
      <button type="button" onClick={() => setLang("en")} className={`${taqInteractive.chip} rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>EN</button>
    </div>
  );
}

function BackTitle({ title, onBack, lang, inNotebook = false }: {
  title: string;
  onBack: () => void;
  lang: PrototypeLang;
  inNotebook?: boolean;
}) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return <div className={`mb-5 flex items-center gap-3 ${inNotebook ? "" : "taq-page-gutter"}`}><button type="button" onClick={onBack} className={`${taqInteractive.icon} flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]`}><BackIcon className="h-5 w-5" /></button><h2 className="text-xl font-black">{title}</h2></div>;
}

function TopBar({
  lang,
  setLang,
  employee,
  onLogout = () => {},
  onNotifications = () => {},
  onEmployeeSettings = () => {},
  showNotifications = true,
  hasNotificationBadge = false,
  notebookMode = false,
  notebookTheme = "yellow",
}: {
  lang: PrototypeLang;
  setLang: (lang: PrototypeLang) => void;
  employee: boolean;
  onLogout?: () => void;
  onNotifications?: () => void;
  onEmployeeSettings?: () => void;
  showNotifications?: boolean;
  hasNotificationBadge?: boolean;
  notebookMode?: boolean;
  notebookTheme?: NotebookThemeId | string;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOutside = (event: PointerEvent) => { if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setAccountMenuOpen(false); };
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
    <header dir="ltr" className="taq-topbar sticky top-0 z-40 shrink-0 pb-2" style={headerStyle}>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "left-[14px]" : "right-[14px]"}`}>
        {!employee && showNotifications && (
          <button type="button" onClick={onNotifications} className={`${taqInteractive.icon} relative flex h-9 w-9 items-center justify-center rounded-full text-[#112A46]`}>
            <Bell className="h-5 w-5" />
            {hasNotificationBadge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#CE4642]" />}
          </button>
        )}
      </div>
      <div className="absolute left-1/2 top-[calc(12px+env(safe-area-inset-top,0px))] -translate-x-1/2 text-center">
        <Logo compact centered />
      </div>
      <div className={`absolute top-[calc(22px+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "right-[36px]" : "left-[36px]"}`}>
        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label={text(lang, "account")}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className={`${taqInteractive.icon} flex h-9 w-9 items-center justify-center rounded-full text-[#112A46] transition ${accountMenuOpen ? "text-[#9A823E]" : ""}`}
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
                className={`absolute top-[44px] z-50 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.06] w-[min(92vw,188px)] ${lang === "ar" ? "right-0" : "left-0"}`}
              >
                <div className="flex justify-center px-1 py-1.5"><LanguageSwitch lang={lang} setLang={setLang} /></div>
                {employee ? (
                  <>
                    <div className="my-1 border-t border-[#F0ECE2]" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setAccountMenuOpen(false); onEmployeeSettings(); }}
                      className={`${taqInteractive.row} flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#112A46]`}
                    >
                      {text(lang, "settings")}
                    </button>
                  </>
                ) : null}
                <div className="my-1 border-t border-[#F0ECE2]" />
                <button role="menuitem" type="button" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className={`${taqInteractive.rowDanger} flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-taq-meta font-black text-[#B44747]`}>
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

type NavItem = { id: string; key: string; icon: LucideIcon };

function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }: {
  lang: PrototypeLang;
  employee: boolean;
  active: string;
  onChange: (page: string) => void;
  onAdd?: () => void;
}) {
  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    return (
      <button type="button" onClick={() => onChange(item.id)} className={`${taqInteractive.nav} flex min-w-[52px] flex-col items-center gap-0.5 px-0.5 text-taq-nav font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}>
        <Icon className="h-4.5 w-4.5" />
        {text(lang, item.key)}
      </button>
    );
  };
  if (employee) {
    return <EmployeeFooterNav lang={lang} onAdd={onAdd} />;
  }
  const leftItems: NavItem[] = [
    { id: "home", key: "home", icon: Home },
    { id: "register", key: "register", icon: ReceiptText },
  ];
  const rightItems: NavItem[] = [
    { id: "notebook", key: "ownerNotebook", icon: BookMarked },
    { id: "settings", key: "settings", icon: Settings },
  ];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center border-t border-[#ECE6DA] bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex min-w-0 flex-1 items-center justify-evenly pe-8">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button type="button" onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className={`${taqInteractive.chip} absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm`}><Plus className="h-7 w-7" strokeWidth={2.4} /></button>
      <div className="flex min-w-0 flex-1 items-center justify-evenly ps-8">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
}

export { Logo, LanguageSwitch, BackTitle, TopBar, BottomNav };

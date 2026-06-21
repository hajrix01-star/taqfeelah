"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { isNotebookThemeDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
import { BackTitle } from "./prototype-runtime-chrome";
import {
  businessLocation,
  businessName,
  text,
} from "./prototype-runtime-demo-data";
import { ThemePicker } from "./prototype-runtime-notebook";
import { ActionRow } from "./owner-settings-ui-primitives";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import type { EmployeeSettingsScreenProps, PrototypeBusiness } from "./prototype-runtime-types";

function EmployeeStoreContext({
  lang,
  currentStore,
  assignedStores,
  onSelect,
  dark = false,
}: {
  lang: EmployeeSettingsScreenProps["lang"];
  currentStore: PrototypeBusiness | null;
  assignedStores: PrototypeBusiness[];
  onSelect: (storeId: string) => void;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!currentStore) return <div className="mb-4 rounded-2xl bg-[#FFF1EE] p-4 text-xs font-bold text-[#B44747]">{text(lang, "noAssignedStores")}</div>;
  return (
    <div ref={selectorRef} className="relative">
      <p className={`text-taq-meta font-bold ${dark ? "text-white/60" : "text-[#827762]"}`}>{text(lang, "currentWorkStore")}</p>
      <button onClick={() => assignedStores.length > 1 && setOpen(!open)} className={`mt-1 flex w-full items-center justify-between text-start ${dark ? "text-white" : "text-[#112A46]"}`}>
        <div><p className="text-sm font-black">{businessName(currentStore, lang)}</p><p className={`mt-0.5 text-taq-meta font-bold ${dark ? "text-white/65" : "text-[#827762]"}`}>{businessLocation(currentStore, lang)}</p></div>
        {assignedStores.length > 1 && <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-taq-nav font-bold ${dark ? "bg-white/10 text-white" : "bg-[#FFF0CB] text-[#806528]"}`}>{text(lang, "switchWorkStore")}<ChevronDown className="h-3 w-3" /></div>}
      </button>
      <AnimatePresence>{open && assignedStores.length > 1 && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[58px] z-30 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[#E8E1D4]">{assignedStores.map((business) => <button key={business.id} onClick={() => { onSelect(String(business.id)); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-start ${currentStore.id === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{currentStore.id === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</motion.div>}</AnimatePresence>
    </div>
  );
}

export function EmployeeSettingsScreen({
  lang,
  onBack,
  currentStore,
  assignedStores,
  onSelectStore,
  employeeNotebookTheme,
  setEmployeeNotebookTheme,
  onOpenSupport,
  onOpenHelp,
}: EmployeeSettingsScreenProps) {
  const perms = ["permissionSummary", "permissionOutflow", "permissionAttach"];
  const [draftTheme, setDraftTheme] = useState(employeeNotebookTheme);
  const [savedNotice, setSavedNotice] = useState(false);
  useEffect(() => { setDraftTheme(employeeNotebookTheme); }, [employeeNotebookTheme]);
  const saveTheme = () => {
    setEmployeeNotebookTheme(draftTheme);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };
  const themeDirty = isNotebookThemeDirty(draftTheme, employeeNotebookTheme);
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
      <BackTitle lang={lang} title={text(lang, "settings")} onBack={onBack} inNotebook />
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "linkedStores")}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} />
        <div className="mt-4 space-y-2 border-t border-[#F0ECE2] pt-3">
          {assignedStores.map((business) => (
            <div key={business.id} className="flex items-center gap-2 text-taq-meta font-bold text-[#716753]">
              <Check className="h-4 w-4 text-[#39A160]" />
              {businessName(business, lang)}
            </div>
          ))}
        </div>
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "شكل دفتر واجهتي" : "My notebook theme"}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <ThemePicker lang={lang} theme={draftTheme} onChange={setDraftTheme} />
        <button type="button" onClick={saveTheme} disabled={!themeDirty} className={`mt-4 w-full rounded-2xl py-3.5 text-xs font-extrabold text-white transition ${themeDirty ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>
          {text(lang, savedNotice ? "savedNotice" : "save")}
        </button>
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "permissions")}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-4 text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
        {perms.map((key) => (
          <div key={key} className="mb-3 flex items-center gap-2 last:mb-0">
            <Check className="h-4 w-4 text-[#39A160]" />
            <span className="text-xs font-bold">{text(lang, key)}</span>
          </div>
        ))}
        <p className="mt-4 border-t border-[#F0ECE2] pt-3 text-taq-meta font-bold text-[#827762]">{text(lang, "ownerOnly")}</p>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <ActionRow label={text(lang, "support")} lang={lang} border onClick={onOpenSupport} />
        <ActionRow label={text(lang, "helpCenter")} lang={lang} onClick={onOpenHelp} />
      </div>
      <ReleaseVersionLine
        className="mt-6 text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}

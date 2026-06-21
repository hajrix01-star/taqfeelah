"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { businesses, businessLocation, businessName, text } from "./prototype-runtime-demo-data";
import { NotebookRow } from "./prototype-runtime-notebook";
import type { DisplayLang, PrototypeBusiness } from "./prototype-runtime-types";

export function LogStoreFilter({ lang, businessesList = businesses, selectedBusiness, setSelectedBusiness, locked = false }: { lang: DisplayLang; businessesList?: PrototypeBusiness[]; selectedBusiness: string; setSelectedBusiness: (value: string) => void; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filterRef = useRef<HTMLDivElement | null>(null);
  const selectedStore = businessesList.find((business) => business.id === selectedBusiness) || null;
  useEffect(() => {
    if (!locked && businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [locked, businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event: PointerEvent) => { if (filterRef.current && !filterRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (businessesList.length <= 1) {
    if (!businessesList[0]) return null;
    return (
      <NotebookRow className="justify-center">
        <p className="text-xs font-black text-[#806528]">{businessName(businessesList[0], lang, true) || businessName(businessesList[0], lang)}</p>
      </NotebookRow>
    );
  }
  const stores = locked
    ? businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))
    : [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))];
  if (locked || businessesList.length <= 2) {
    return (
      <NotebookRow>
        <div className={`grid w-full items-end gap-2 ${stores.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {stores.map((store) => {
            const active = selectedBusiness === store.id;
            return (
              <button key={store.id} type="button" disabled={locked} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[#B44747]" : "text-[#957D43]"} ${locked ? "cursor-default" : ""}`}>
                <span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span>
              </button>
            );
          })}
        </div>
      </NotebookRow>
    );
  }
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <NotebookRow className="justify-center">
      <div ref={filterRef} className="relative pb-[8px]">
        <button type="button" onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180 text-[#B44747]" : "text-[#806528]"}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button type="button" onClick={() => { setSelectedBusiness("all"); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} type="button" onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

export function RegisterStoreChips({ lang, businessesList, selectedBusiness, setSelectedBusiness, locked = false }: { lang: DisplayLang; businessesList: PrototypeBusiness[]; selectedBusiness: string; setSelectedBusiness: (value: string) => void; locked?: boolean }) {
  if (businessesList.length <= 1) {
    if (!businessesList[0]) return null;
    return (
      <div className="mb-2 flex justify-center">
        <span className="rounded-full bg-[#112A46]/[0.06] px-3 py-1 text-[11px] font-black text-[#112A46]">
          {businessName(businessesList[0], lang, true) || businessName(businessesList[0], lang)}
        </span>
      </div>
    );
  }

  const stores = locked
    ? businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))
    : [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))];

  if (locked || businessesList.length <= 3) {
    return (
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        {stores.map((store) => {
          const active = selectedBusiness === store.id;
          return (
            <button
              key={store.id}
              type="button"
              disabled={locked}
              onClick={() => setSelectedBusiness(store.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-colors duration-150 ${
                active
                  ? "bg-[#112A46] text-white shadow-[0_2px_8px_rgba(17,42,70,0.18)]"
                  : "bg-white text-[#716753] ring-1 ring-[#E8E1D4]"
              } ${locked ? "cursor-default" : ""}`}
            >
              {store.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <LogStoreFilter
      lang={lang}
      businessesList={businessesList}
      selectedBusiness={selectedBusiness}
      setSelectedBusiness={setSelectedBusiness}
      locked={locked}
    />
  );
}

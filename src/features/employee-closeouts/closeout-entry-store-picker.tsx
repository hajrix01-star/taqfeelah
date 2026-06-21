"use client";

import { resolveEmployeeStoreName } from "./store-name-resolver";
import { businessName, text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import type { CloseoutSyncLang, StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";

function resolveStoreLabel(store: StoreRef, lang: CloseoutSyncLang): string {
  return resolveEmployeeStoreName(store, lang) || businessName(store, lang, true) || businessName(store, lang);
}

export function CloseoutEntryStorePicker({
  lang,
  stores = [],
  selectedStoreId = "",
  onSelectStore,
}: {
  lang: CloseoutSyncLang;
  stores?: StoreRef[];
  selectedStoreId?: string;
  onSelectStore: (storeId: string) => void | Promise<void>;
}) {
  if (!stores || stores.length <= 1) return null;

  return (
    <div className="mb-4 rounded-2xl border border-[#E8E1D4] bg-[rgba(255,253,248,0.95)] px-4 py-3">
      <p className="text-taq-meta font-bold text-[#806528]">{text(lang, "operationStore")}</p>
      <p className="mt-1 text-taq-nav font-bold text-[#827762]">
        {!selectedStoreId ? text(lang, "chooseStoreToStartEntry") : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {stores.map((store) => {
          const active = selectedStoreId === store.id;
          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelectStore(store.id)}
              className={`rounded-full px-3 py-1.5 text-taq-meta font-black ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-[#E8E1D4]"}`}
            >
              {resolveStoreLabel(store, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

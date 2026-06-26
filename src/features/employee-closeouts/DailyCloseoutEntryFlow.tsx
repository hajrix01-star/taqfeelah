"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import { preloadNotebookShareCapture } from "../daily-closeouts/notebook-share-capture";
import { notebookLinesBackground } from "../daily-closeouts/notebook-themes";
import AttachmentLightbox from "../../components/AttachmentLightbox";
import { text } from "../../components/taqfeelah-app/taqfeelah-app-reference-data";
import { DailyCloseoutEntryFormBody } from "./daily-closeout-entry-form-body";
import { useDailyCloseoutEntryState } from "./use-daily-closeout-entry-state";
import type {
  CloseoutSyncLang,
  DailyCloseoutRecord,
  NotebookThemeId,
  SalesChannelConfig,
  StoreRef,
} from "@/features/daily-closeouts/daily-closeouts-types";

export default function DailyCloseoutEntryFlow({
  lang,
  notebookTheme,
  closeout: initialCloseout,
  salesChannels,
  storeName,
  assignedStores = [],
  selectedStoreId = "",
  onSelectEntryStore = () => {},
  isOwnerEdit = false,
  fullScreenOverlay = true,
  rootPosition,
  onCancel,
  onSubmit,
  findForStoreDate: _findForStoreDate,
  channelLabel,
  saving = false,
  sharePreviewOpen = false,
}: {
  lang: CloseoutSyncLang;
  notebookTheme?: NotebookThemeId | string;
  closeout: DailyCloseoutRecord;
  salesChannels: SalesChannelConfig[];
  storeName?: string;
  assignedStores?: StoreRef[];
  selectedStoreId?: string;
  onSelectEntryStore?: (storeId: string) => void | Promise<void>;
  isOwnerEdit?: boolean;
  fullScreenOverlay?: boolean;
  /** When fullScreenOverlay is true: `fixed` covers the viewport; `fill` fills a positioned parent (e.g. portal). */
  rootPosition?: "fixed" | "fill";
  onCancel: () => void;
  onSubmit: (closeout: DailyCloseoutRecord, meta: { isOwnerEdit: boolean }) => void | Promise<void>;
  findForStoreDate?: (date: string) => DailyCloseoutRecord | null;
  channelLabel?: (channel: SalesChannelConfig) => string;
  saving?: boolean;
  sharePreviewOpen?: boolean;
}) {
  const state = useDailyCloseoutEntryState({
    lang,
    notebookTheme,
    initialCloseout,
    salesChannels,
    storeName,
    isOwnerEdit,
    onSubmit,
    channelLabel,
  });

  const {
    totals,
    previewAttachment,
    setPreviewAttachment,
    handleSubmit,
  } = state;

  useEffect(() => {
    preloadNotebookShareCapture();
  }, []);

  const resolvedRootPosition = rootPosition ?? (fullScreenOverlay ? "fixed" : "fill");
  const rootClassName = resolvedRootPosition === "fixed"
    ? "fixed inset-0 z-[50] flex flex-col"
    : "relative flex h-full min-h-0 flex-col";
  const headerClassName = fullScreenOverlay
    ? "relative z-[2] flex shrink-0 items-center justify-between border-b border-[#ECE6DA]/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]"
    : "relative z-[2] flex shrink-0 items-center justify-between border-b border-[#ECE6DA]/80 px-4 pb-3 pt-3";

  const storeSelectionRequired = assignedStores.length > 1;
  const formEnabled = !storeSelectionRequired || Boolean(selectedStoreId);

  return (
    <div className={`${rootClassName}${sharePreviewOpen ? " pointer-events-none" : ""}`} style={notebookLinesBackground(notebookTheme || "yellow")}>
      <header
        className={headerClassName}
        style={notebookLinesBackground(notebookTheme || "yellow")}
      >
        <button type="button" disabled={saving} onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05] disabled:opacity-40">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-black">{lang === "ar" ? (isOwnerEdit ? "تعديل التقفيلة" : "تقفيلة يوم جديد") : (isOwnerEdit ? "Edit closeout" : "New closeout")}</p>
        <span className="w-9" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <NotebookScrollSurface theme={notebookTheme || "yellow"} lang={lang}>
          <div className="taq-owner-page taq-notebook-body pb-36 pt-2">
            <DailyCloseoutEntryFormBody
              lang={lang}
              storeName={storeName}
              salesChannels={salesChannels}
              assignedStores={assignedStores}
              selectedStoreId={selectedStoreId}
              onSelectEntryStore={onSelectEntryStore}
              formEnabled={formEnabled}
              {...state}
            />
          </div>
        </NotebookScrollSurface>
      </div>
      <div className="shrink-0 border-t border-[#ECE6DA]/80 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={saving || !formEnabled || (totals.totalSales || 0) <= 0}
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {text(lang, saving ? "saving" : (isOwnerEdit ? "saveCloseoutChanges" : "saveAndSend"))}
        </button>
      </div>
      {saving ? (
        <div className="absolute inset-0 z-[3] flex items-center justify-center bg-[#F8F6F0]/80 text-sm font-black text-[#257844]">
          {text(lang, "saving")}
        </div>
      ) : null}
      <AttachmentLightbox
        open={Boolean(previewAttachment)}
        src={previewAttachment}
        lang={lang}
        onClose={() => setPreviewAttachment("")}
      />
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import { notebookLinesBackground } from "../daily-closeouts/notebook-themes";
import AttachmentLightbox from "../../components/AttachmentLightbox";
import { DailyCloseoutEntryFormBody } from "./daily-closeout-entry-form-body";
import { useDailyCloseoutEntryState } from "./use-daily-closeout-entry-state";

export default function DailyCloseoutEntryFlow({
  lang,
  notebookTheme,
  closeout: initialCloseout,
  salesChannels,
  storeName,
  isOwnerEdit = false,
  fullScreenOverlay = true,
  onCancel,
  onSubmit,
  findForStoreDate: _findForStoreDate,
  channelLabel,
  saving = false,
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

  const rootClassName = fullScreenOverlay
    ? "absolute inset-0 z-[50] flex flex-col"
    : "flex h-full min-h-0 flex-col";
  const headerClassName = fullScreenOverlay
    ? "relative z-[2] flex shrink-0 items-center justify-between border-b border-[#ECE6DA]/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]"
    : "relative z-[2] flex shrink-0 items-center justify-between border-b border-[#ECE6DA]/80 px-4 pb-3 pt-3";

  return (
    <div className={rootClassName} style={notebookLinesBackground(notebookTheme)}>
      <header
        className={headerClassName}
        style={notebookLinesBackground(notebookTheme)}
      >
        <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-black">{lang === "ar" ? (isOwnerEdit ? "تعديل التقفيلة" : "تقفيلة يوم جديد") : (isOwnerEdit ? "Edit closeout" : "New closeout")}</p>
        <span className="w-9" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <NotebookScrollSurface theme={notebookTheme} lang={lang}>
          <div className="taq-owner-page taq-notebook-body pb-36 pt-2">
            <DailyCloseoutEntryFormBody
              lang={lang}
              storeName={storeName}
              salesChannels={salesChannels}
              {...state}
            />
          </div>
        </NotebookScrollSurface>
      </div>
      <div className="shrink-0 border-t border-[#ECE6DA]/80 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={saving || totals.totalSales <= 0}
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white disabled:opacity-50"
        >
          {lang === "ar" ? "حفظ وإرسال" : "Save & send"}
        </button>
      </div>
      <AttachmentLightbox
        open={Boolean(previewAttachment)}
        src={previewAttachment}
        lang={lang}
        onClose={() => setPreviewAttachment("")}
      />
    </div>
  );
}

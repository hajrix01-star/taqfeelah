"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Send,
  X,
} from "lucide-react";
import { notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { canFetchNotebookExportForSnapshot } from "@/features/exports-attachments/client/notebook-export-share-data";
import { useNotebookExportShareData } from "@/features/exports-attachments/client/use-notebook-export-share-data";
import { businesses, text } from "./prototype-runtime-demo-data";
import { todayIsoDate } from "./prototype-runtime-notebook";
import { buildDataExportModel } from "@/features/exports/client/build-data-export-model";
import { buildNotebookShareModel } from "./build-notebook-share-model";
import {
  captureNotebookPreviewBlob,
  downloadBlobFile,
  exportNotebookShareExcel,
  exportNotebookSharePdf,
  shareNotebookImageToWhatsApp,
} from "./notebook-share-export-helpers";
import { NotebookShareImagePreview } from "./notebook-share-image-preview";
import type { NotebookShareChannelRow, NotebookShareModalProps } from "./prototype-runtime-types";
import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";

const ALL_SHARE_FORMATS = [
  { id: "image", label: "imageFormat", icon: FileImage },
  { id: "pdf", label: "pdfFormat", icon: FileText },
  { id: "excel", label: "excelFormat", icon: FileSpreadsheet },
];

export function NotebookShareModal({
  lang,
  snapshot,
  onClose,
  businessesList = businesses,
  operationalEntries = [],
  archivedBusinessIds = [],
  notebookExportApiEnabled = false,
  notebookExportAuth = {},
  allowedFormats = ["image", "pdf", "excel"],
}: NotebookShareModalProps) {
  const shareFormats = ALL_SHARE_FORMATS.filter((item) => allowedFormats.includes(item.id));
  const [format, setFormat] = useState(() => allowedFormats[0] || "excel");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const cachedImageFileRef = useRef<File | null>(null);
  const preCaptureTokenRef = useRef(0);
  const {
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
    loading: apiLoading,
  } = useNotebookExportShareData({
    enabled: notebookExportApiEnabled,
    auth: notebookExportAuth,
    snapshot,
  });
  const shouldWaitForApi = canFetchNotebookExportForSnapshot(snapshot, notebookExportApiEnabled)
    && apiLoading
    && !snapshot?.summaryRecord;

  useEffect(() => { if (snapshot) { setFormat(allowedFormats[0] || "excel"); setImageError(""); setShareHint(""); cachedImageFileRef.current = null; } }, [snapshot, allowedFormats]);

  useEffect(() => {
    if (!snapshot || format !== "image" || shouldWaitForApi) {
      if (shouldWaitForApi) cachedImageFileRef.current = null;
      if (!snapshot || format !== "image") cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const paperColor = (notebookThemes[(snapshot.theme || "yellow") as NotebookThemeId] || notebookThemes.yellow).paper || "#FFFDF7";
    const filename = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${snapshot.selectedDate || todayIsoDate()}.png`;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookPreviewBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], filename, { type: "image/png" });
          }
        } catch {
          if (!cancelled && captureToken === preCaptureTokenRef.current) cachedImageFileRef.current = null;
        }
      }, 400);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [snapshot, format, lang, shouldWaitForApi, apiEntries, apiRecord, apiChannelRows]);

  const model = useMemo(() => {
    if (!snapshot) return null;
    return buildNotebookShareModel({
      snapshot,
      lang,
      businessesList,
      operationalEntries,
      archivedBusinessIds,
      apiEntries,
      apiRecord,
      apiChannelRows: apiChannelRows as NotebookShareChannelRow[] | null | undefined,
      apiDayRows,
    });
  }, [
    snapshot,
    lang,
    businessesList,
    operationalEntries,
    archivedBusinessIds,
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
  ]);

  const exportModel = useMemo(() => {
    if (!snapshot) return null;
    return buildDataExportModel({
      snapshot,
      lang,
      businessesList,
      operationalEntries,
      archivedBusinessIds,
      apiEntries,
      apiRecord,
      apiChannelRows,
      apiDayRows,
    });
  }, [
    snapshot,
    lang,
    businessesList,
    operationalEntries,
    archivedBusinessIds,
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
  ]);

  if (!snapshot || !model || !exportModel) return null;

  const {
    shareCaption,
    activeTheme,
    imageFilename,
  } = model;

  const {
    previewTable,
    title: exportStoreTitle,
    periodLabel: exportPeriodLabel,
  } = exportModel;

  const buildNotebookImageFile = async () => {
    if (!previewRef.current) throw new Error("missing-preview");
    const blob = await captureNotebookPreviewBlob(previewRef.current, activeTheme.paper || "#FFFDF7");
    return new File([blob], imageFilename, { type: "image/png" });
  };
  const resolveNotebookImageFile = async () => {
    if (cachedImageFileRef.current) return cachedImageFileRef.current;
    const file = await buildNotebookImageFile();
    cachedImageFileRef.current = file;
    return file;
  };
  const runImageAction = async (action: (file: File) => void | Promise<void>) => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    try {
      const file = await resolveNotebookImageFile();
      await action(file);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setImageError(text(lang, "shareImageFailed"));
    } finally {
      setImageBusy(false);
    }
  };
  const downloadNotebookImage = () => runImageAction(async (file: File) => downloadBlobFile(file, imageFilename));
  const shareImageViaWhatsApp = () => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    void (async () => {
      try {
        const file = await resolveNotebookImageFile();
        const result = await shareNotebookImageToWhatsApp(file, shareCaption, lang);
        if (result.method === "share") {
          setShareHint(
            lang === "ar"
              ? "تم فتح نافذة المشاركة. اختر واتساب لإرسال الصورة مع النص."
              : "Share sheet opened. Choose WhatsApp to send the image with the caption.",
          );
        } else if (result.method === "clipboard") setShareHint(text(lang, "shareImagePasteHint"));
        else if (result.method === "text-only") setShareHint(text(lang, "shareImageWhatsAppUnavailable"));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setImageError(text(lang, "shareImageFailed"));
      } finally {
        setImageBusy(false);
      }
    })();
  };
  const exportExcel = () => exportNotebookShareExcel({ ...exportModel, lang });
  const exportPdf = () => exportNotebookSharePdf({ ...exportModel, lang });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0">
      <div className="max-h-[92%] overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:w-full sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
            <h3 className="text-base font-black">{format === "image" ? text(lang, "notebookImagePreview") : text(lang, "professionalReportPreview")}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className={`mb-4 grid gap-2 ${shareFormats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {shareFormats.map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button type="button" key={item.id} onClick={() => setFormat(item.id)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-taq-meta font-black transition ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.045]"}`}>
                <Icon className="h-5 w-5" />{text(lang, item.label)}
              </button>
            );
          })}
        </div>
        {format === "image" ? (
          <>
            <NotebookShareImagePreview
              previewRef={previewRef}
              lang={lang}
              snapshot={snapshot}
              model={model}
            />
            {shareHint && <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">{shareHint}</p>}
            {imageError && <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">{imageError}</p>}
          </>
        ) : (
          <div className="mb-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.055]">
            <div className="bg-[#112A46] p-4 text-white">
              <div className="flex items-start justify-between gap-2"><div><p className="text-taq-meta font-medium text-white/65">{text(lang, "reportFor")}</p><h4 className="mt-1 text-sm font-extrabold">{exportStoreTitle}</h4></div><span className={`rounded-lg px-2 py-1 text-taq-meta font-black ${format === "pdf" ? "bg-[#B44747]" : "bg-[#217346]"}`}>{format === "pdf" ? "PDF" : "Excel"}</span></div>
              <div className="mt-3 flex items-center justify-between text-taq-meta font-medium text-white/70"><span>{text(lang, "selectedPeriod")}</span><span>{exportPeriodLabel}</span></div>
            </div>
            <div className="p-3">
              <div className="grid rounded-t-lg bg-[#F4F2ED] px-3 py-2 text-taq-meta font-bold text-[#716753]" style={{ gridTemplateColumns: `repeat(${previewTable.headers.length}, minmax(0, 1fr))` }}>
                {previewTable.headers.map((header, index) => <span key={`export-head-${index}`} className={index > 0 ? "text-end" : ""}>{header}</span>)}
              </div>
              {previewTable.rows.map((row, index) => (
                <div key={`export-row-${index}`} className={`grid px-3 py-3 text-taq-meta ${index < previewTable.rows.length - 1 ? "border-b border-[#ECE6DA]" : ""} font-bold`} style={{ gridTemplateColumns: `repeat(${previewTable.headers.length}, minmax(0, 1fr))` }}>
                  {previewTable.headers.map((_, cellIndex) => <span key={`export-cell-${index}-${cellIndex}`} className={`${cellIndex > 0 ? "text-end tabular-nums" : "text-[#112A46]"} truncate`}>{row[cellIndex] || ""}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#ECE6DA] px-4 py-3 text-taq-meta font-bold text-[#827762]"><span>{text(lang, "appName")}</span><span>{text(lang, "preparedForExport")}</span></div>
          </div>
        )}
        {format === "image" ? (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            <button type="button" disabled={imageBusy} onClick={downloadNotebookImage} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60">
              <Download className="h-3.5 w-3.5" />{text(lang, "downloadNotebookImage")}
            </button>
            <button type="button" disabled={imageBusy} onClick={shareImageViaWhatsApp} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-60">
              <Send className="h-3.5 w-3.5" />{imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparing…") : text(lang, "shareViaWhatsApp")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
            <button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            {format === "pdf" && <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white"><FileText className="h-4 w-4" />{text(lang, "exportPdf")}</button>}
            {format === "excel" && <button type="button" onClick={() => { void exportExcel(); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#217346] py-3.5 text-xs font-black text-white"><FileSpreadsheet className="h-4 w-4" />{text(lang, "exportExcel")}</button>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildCloseoutShareOperationRows, closeoutShareTotals } from "../daily-closeouts/closeout-share-operations";
import NotebookDaySharePreview from "../daily-closeouts/NotebookDaySharePreview";
import { captureNotebookShareBlob } from "../daily-closeouts/notebook-share-capture";
import { notebookThemePaperColor, resolveShareNotebookTheme } from "../daily-closeouts/notebook-themes";
import { buildEmployeeShareCaption, shareEmployeeCloseoutImage } from "./employee-closeout-share";
import { resolveCloseoutStoreName } from "./store-name-resolver";

import type { CloseoutShareModalProps } from "./employee-closeouts-types";
import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { NotebookSharePreviewLabels } from "@/features/daily-closeouts/daily-closeouts-types";

const shareLabels = (lang: CloseoutSyncLang): NotebookSharePreviewLabels & { myCloseout: string } => ({
  sales: lang === "ar" ? "الداخل" : "Sales",
  purchasesExpenses: lang === "ar" ? "الخارج" : "Outflow",
  outflowRatio: lang === "ar" ? "نسبة الخارج" : "Outflow ratio",
  netMovement: lang === "ar" ? "صافي الحركة" : "Net movement",
  operations: lang === "ar" ? "العمليات" : "Operations",
  myCloseout: lang === "ar" ? "تقفيلتي" : "My closeout",
});

export default function CloseoutShareModal({
  lang,
  open,
  closeout,
  storeName,
  employeeName = "",
  notebookTheme = "yellow",
  formatCalendarDate,
  newlySubmitted = false,
  onClose,
}: CloseoutShareModalProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const cachedImageFileRef = useRef<File | null>(null);
  const preCaptureTokenRef = useRef(0);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const [imageReady, setImageReady] = useState(false);
  const [preCaptureDone, setPreCaptureDone] = useState(false);

  const periodLabel = closeout && formatCalendarDate ? formatCalendarDate(closeout.date || "", lang) : "";
  const resolvedStoreName = resolveCloseoutStoreName({ preferredStoreName: storeName, closeout, lang });
  const resolvedEmployeeName = String(
    employeeName
    || closeout?.submittedByName
    || closeout?.openedByName
    || closeout?.employeeName
    || "",
  ).trim();
  const resolvedPeriodLabel = periodLabel || closeout?.date || "";
  const labels = useMemo(() => shareLabels(lang), [lang]);
  const totals = useMemo(() => (closeout ? closeoutShareTotals(closeout) : null), [closeout]);
  const operations = useMemo(() => (closeout ? buildCloseoutShareOperationRows(closeout, lang) : []), [closeout, lang]);
  const shareCaption = useMemo(
    () => (closeout
      ? buildEmployeeShareCaption(
        lang,
        resolvedStoreName,
        resolvedEmployeeName,
        resolvedPeriodLabel,
        closeout.date || "",
        totals,
      )
      : ""),
    [lang, closeout, resolvedStoreName, resolvedEmployeeName, resolvedPeriodLabel, totals],
  );
  const selectedTheme = resolveShareNotebookTheme(notebookTheme, closeout?.notebookTheme);
  const paperColor = notebookThemePaperColor(selectedTheme);

  const previewData = useMemo(() => {
    if (!totals || !closeout) return null;
    return {
      lang,
      theme: selectedTheme,
      periodLabel: resolvedPeriodLabel,
      title: labels.myCloseout,
      storeName: resolvedStoreName,
      employeeName: resolvedEmployeeName,
      labels: { ...labels, outflowRatio: undefined },
      record: { ...totals, ratio: undefined },
      operations,
      showOutflowRatio: false,
    };
  }, [totals, closeout, lang, resolvedPeriodLabel, labels, resolvedStoreName, resolvedEmployeeName, shareCaption, operations, selectedTheme]);

  useEffect(() => {
    if (!open || !closeout) {
      setImageBusy(false);
      setImageError("");
      setShareHint("");
      setImageReady(false);
      setPreCaptureDone(false);
      cachedImageFileRef.current = null;
      return undefined;
    }
    setImageError("");
    setShareHint("");
    setImageReady(false);
    setPreCaptureDone(false);
    cachedImageFileRef.current = null;
    return undefined;
  }, [open, closeout?.id]);

  useEffect(() => {
    if (!open || !closeout || !previewData) {
      cachedImageFileRef.current = null;
      setImageReady(false);
      setPreCaptureDone(false);
      return undefined;
    }
    setImageReady(false);
    setPreCaptureDone(false);
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const filename = `taqfeelah-${closeout.date}.png`;
    let innerFrameId = 0;
    const frameId = requestAnimationFrame(() => {
      innerFrameId = requestAnimationFrame(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current) return;
        if (!previewRef.current) {
          setPreCaptureDone(true);
          return;
        }
        try {
          const blob = await captureNotebookShareBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], filename, { type: "image/png" });
            setImageReady(true);
          }
        } catch {
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = null;
            setImageReady(false);
          }
        } finally {
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            setPreCaptureDone(true);
          }
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (innerFrameId) cancelAnimationFrame(innerFrameId);
    };
  }, [open, closeout?.id, previewData, paperColor]);

  const imageFilename = closeout ? `taqfeelah-${closeout.date}.png` : "taqfeelah-closeout.png";

  const buildNotebookImageFile = async () => {
    if (!previewRef.current) throw new Error("missing-preview");
    const blob = await captureNotebookShareBlob(previewRef.current, paperColor);
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
      setImageError(lang === "ar" ? "تعذّر تجهيز الصورة" : "Could not prepare image");
    } finally {
      setImageBusy(false);
    }
  };

  const downloadImage = () => {
    runImageAction(async (file: File) => {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setShareHint(lang === "ar" ? "تم حفظ الصورة بنجاح." : "Image saved.");
    });
  };

  const shareImage = async () => {
    await runImageAction(async (file: File) => {
      const result = await shareEmployeeCloseoutImage({ file, caption: shareCaption, lang });
      if (result.method === "clipboard") {
        setShareHint(
          lang === "ar"
            ? "تم فتح واتساب بالمبالغ في النص، والصورة منسوخة — الصق الصورة في نفس المحادثة."
            : "WhatsApp opened with amounts in the message, and image copied — paste the image in the same chat.",
        );
      } else if (result.method === "text-only") {
        setShareHint(
          lang === "ar"
            ? "تم فتح واتساب بالمبالغ في النص — أرفق الصورة يدويًا من المعرض إن رغبت."
            : "WhatsApp opened with amounts in the message — attach the image manually from gallery if needed.",
        );
      } else if (result.method === "share") {
        setShareHint(
          lang === "ar"
            ? "تم فتح نافذة المشاركة. اختر واتساب لإرسال الصورة مع النص عند دعم الجهاز."
            : "Share sheet opened. Choose WhatsApp to send image with text when supported.",
        );
      }
    });
  };

  const whatsAppDisabled = imageBusy || !previewData || !preCaptureDone;

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="closeout-share-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[220] flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0"
          onClick={newlySubmitted ? undefined : onClose}
        >
          <motion.div
            dir={lang === "ar" ? "rtl" : "ltr"}
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[92%] w-full overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"
            onClick={(event) => event.stopPropagation()}
          >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 text-start">
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "خيارات المشاركة" : "Share options"}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "معاينة صورة التقفيلة" : "Closeout image preview"}</h3>
              {(resolvedStoreName || resolvedEmployeeName) ? (
                <p className="mt-1 text-taq-meta font-bold leading-snug text-[#827762]">
                  {resolvedStoreName ? (
                    <span className="block truncate">
                      {lang === "ar" ? "المحل: " : "Store: "}
                      <span className="text-[#112A46]">{resolvedStoreName}</span>
                    </span>
                  ) : null}
                  {resolvedEmployeeName ? (
                    <span className="block truncate">
                      {lang === "ar" ? "الموظف: " : "Employee: "}
                      <span className="text-[#112A46]">{resolvedEmployeeName}</span>
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]">
              <X className="h-4 w-4" />
            </button>
          </div>
          {newlySubmitted && (
            <p className="mb-3 rounded-2xl bg-[#E6F5E9] px-3 py-2 text-taq-meta font-bold text-[#257844]">
              {lang === "ar" ? "تم إغلاق اليوم وإرساله — يمكنك مشاركة الصورة الآن" : "Day closed and sent — share the image now"}
            </p>
          )}
          <div className="relative mb-2">
            {previewData ? (
              <div ref={previewRef} className="overflow-hidden rounded-[24px] p-0 shadow-lg" style={{ backgroundColor: paperColor }}>
                <NotebookDaySharePreview {...previewData} fluid />
              </div>
            ) : (
              <div className="flex h-[320px] w-full items-center justify-center rounded-[24px] bg-white text-xs font-bold text-[#827762] ring-1 ring-black/[0.055]">
                {lang === "ar" ? "لا توجد بيانات للمشاركة" : "Nothing to share"}
              </div>
            )}
            {imageBusy ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8F6F0]/88 text-xs font-bold text-[#827762]">
                {lang === "ar" ? "جاري تجهيز الصورة…" : "Preparing image…"}
              </div>
            ) : null}
          </div>
          {previewData && !imageReady && !imageBusy ? (
            <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">
              {lang === "ar" ? "جاري تجهيز ملف المشاركة في الخلفية…" : "Preparing share file in the background…"}
            </p>
          ) : null}
          {imageReady ? (
            <p className="mb-2 text-center text-taq-meta font-bold text-[#257844]">
              {lang === "ar" ? "الصورة جاهزة للمشاركة" : "Image ready to share"}
            </p>
          ) : null}
          {shareHint && (
            <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">
              {shareHint}
            </p>
          )}
          {imageError && (
            <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">
              {imageError}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">
              {lang === "ar" ? "إغلاق" : "Close"}
            </button>
            <button type="button" onClick={downloadImage} disabled={imageBusy || !previewData} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-50">
              {lang === "ar" ? "تنزيل PNG" : "Download PNG"}
            </button>
            <button type="button" onClick={shareImage} disabled={whatsAppDisabled} className="rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-50">
              {imageBusy
                ? (lang === "ar" ? "جاري التجهيز…" : "Preparing…")
                : (lang === "ar" ? "واتساب" : "WhatsApp")}
            </button>
          </div>
        </motion.div>
      </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

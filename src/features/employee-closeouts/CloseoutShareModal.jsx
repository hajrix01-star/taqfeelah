"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildCloseoutShareOperationRows, closeoutShareTotals } from "../daily-closeouts/closeout-share-operations";
import NotebookDaySharePreview from "../daily-closeouts/NotebookDaySharePreview";
import { captureNotebookShareBlob } from "../daily-closeouts/notebook-share-capture";
import { notebookThemes } from "../daily-closeouts/notebook-themes";
import { buildEmployeeShareCaption, copyEmployeeShareCaption, shareEmployeeCloseoutImage } from "./employee-closeout-share";

const shareLabels = (lang) => ({
  sales: lang === "ar" ? "المبيعات" : "Sales",
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
  reviewWorkflowEnabled = false,
  newlySubmitted = false,
  onClose,
}) {
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const [shareActionsOpen, setShareActionsOpen] = useState(false);

  const periodLabel = closeout && formatCalendarDate ? formatCalendarDate(closeout.date, lang) : "";
  const labels = useMemo(() => shareLabels(lang), [lang]);
  const totals = useMemo(() => (closeout ? closeoutShareTotals(closeout) : null), [closeout]);
  const operations = useMemo(() => (closeout ? buildCloseoutShareOperationRows(closeout, lang) : []), [closeout, lang]);
  const shareCaption = useMemo(
    () => (storeName && periodLabel ? buildEmployeeShareCaption(lang, storeName, employeeName, periodLabel, closeout?.date) : ""),
    [lang, storeName, employeeName, periodLabel, closeout?.date],
  );
  const selectedTheme = closeout?.notebookTheme || notebookTheme || "yellow";
  const paperColor = notebookThemes[selectedTheme]?.paper || notebookThemes.yellow?.paper || "#FFFDF7";

  const previewData = useMemo(() => {
    if (!totals || !closeout) return null;
    return {
      lang,
      theme: selectedTheme,
      periodLabel,
      title: labels.myCloseout,
      storeName,
      employeeName,
      captionFooter: shareCaption,
      labels,
      record: totals,
      operations,
    };
  }, [totals, closeout, lang, periodLabel, labels, storeName, employeeName, shareCaption, operations, selectedTheme]);

  useEffect(() => {
    if (!open || !closeout) {
      setImageBusy(false);
      setImageError("");
      setShareHint("");
      setShareActionsOpen(false);
      cachedImageFileRef.current = null;
      return undefined;
    }
    setImageError("");
    setShareHint("");
    setShareActionsOpen(false);
    cachedImageFileRef.current = null;
    return undefined;
  }, [open, closeout?.id]);

  useEffect(() => {
    if (!open || !closeout || !previewData) {
      cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const filename = `taqfeelah-${closeout.date}.png`;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookShareBlob(previewRef.current, paperColor);
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
      window.clearTimeout(timeoutId);
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

  const runImageAction = async (action) => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    try {
      const file = await resolveNotebookImageFile();
      await action(file);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setImageError(lang === "ar" ? "تعذّر تجهيز الصورة" : "Could not prepare image");
    } finally {
      setImageBusy(false);
    }
  };

  const downloadImage = () => {
    runImageAction(async (file) => {
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

  const copyCaptionOnly = async () => {
    if (!shareCaption) return;
    const copied = await copyEmployeeShareCaption(shareCaption);
    setShareHint(copied ? (lang === "ar" ? "تم نسخ النص." : "Caption copied.") : (lang === "ar" ? "تعذّر نسخ النص." : "Could not copy caption."));
  };

  const shareImage = async () => {
    await runImageAction(async (file) => {
      const result = await shareEmployeeCloseoutImage({ file, caption: shareCaption, lang });
      if (result.method === "clipboard") {
        setShareHint(
          lang === "ar"
            ? "تم نسخ الصورة. الصقها في واتساب، وإذا غاب النص استخدم زر «نسخ النص»."
            : "Image copied. Paste into WhatsApp; if text is missing, use Copy caption.",
        );
      } else if (result.method === "text-only") {
        setShareHint(
          lang === "ar"
            ? "تم فتح واتساب بالنص. إذا لزم، أرفق الصورة يدويًا."
            : "WhatsApp opened with text. Attach image manually if needed.",
        );
      } else if (result.method === "share") {
        setShareHint(
          lang === "ar"
            ? "تم فتح نافذة المشاركة."
            : "Share sheet opened.",
        );
      }
    });
  };

  const toggleShareActions = () => {
    if (imageBusy || !previewData) return;
    setShareActionsOpen((current) => !current);
  };

  const shareViaWhatsApp = async () => {
    setShareActionsOpen(false);
    await shareImage();
  };

  const downloadViaShareActions = () => {
    setShareActionsOpen(false);
    downloadImage();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0"
        onClick={onClose}
      >
        <motion.div
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          className="relative z-10 max-h-[92%] w-full overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 text-start">
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "خيارات المشاركة" : "Share options"}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "معاينة صورة التقفيلة" : "Closeout image preview"}</h3>
              {(storeName || employeeName) ? (
                <p className="mt-1 text-taq-meta font-bold leading-snug text-[#827762]">
                  {storeName ? (
                    <span className="block truncate">
                      {lang === "ar" ? "المحل: " : "Store: "}
                      <span className="text-[#112A46]">{storeName}</span>
                    </span>
                  ) : null}
                  {employeeName ? (
                    <span className="block truncate">
                      {lang === "ar" ? "الموظف: " : "Employee: "}
                      <span className="text-[#112A46]">{employeeName}</span>
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
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8F6F0]/92 text-xs font-bold text-[#827762]">
                {lang === "ar" ? "جاري تجهيز الصورة…" : "Preparing image…"}
              </div>
            ) : null}
          </div>
          <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">
            {lang === "ar" ? "الصورة جاهزة للمشاركة" : "Image ready to share"}
          </p>
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
          <div className="space-y-2">
            <button type="button" onClick={toggleShareActions} disabled={imageBusy || !previewData} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {shareActionsOpen
                ? (lang === "ar" ? "إخفاء خيارات المشاركة" : "Hide share options")
                : (lang === "ar" ? "مشاركة" : "Share")}
            </button>
            {shareActionsOpen ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={shareViaWhatsApp} disabled={imageBusy || !previewData} className="rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-50">
                  {lang === "ar" ? "إرسال واتساب" : "WhatsApp"}
                </button>
                <button type="button" onClick={downloadViaShareActions} disabled={imageBusy || !previewData} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-50">
                  {lang === "ar" ? "تنزيل PNG" : "Download PNG"}
                </button>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={copyCaptionOnly} disabled={!shareCaption} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-50">
                {lang === "ar" ? "نسخ النص" : "Copy caption"}
              </button>
              <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

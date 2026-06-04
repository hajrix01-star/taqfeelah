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
  reviewWorkflowEnabled = true,
  newlySubmitted = false,
  onClose,
}) {
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const previewImageUrlRef = useRef("");
  const preCaptureTokenRef = useRef(0);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");

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
      cachedImageFileRef.current = null;
      if (previewImageUrlRef.current) {
        URL.revokeObjectURL(previewImageUrlRef.current);
        previewImageUrlRef.current = "";
      }
      setPreviewImageUrl("");
      return undefined;
    }
    setImageError("");
    setShareHint("");
    cachedImageFileRef.current = null;
    if (previewImageUrlRef.current) {
      URL.revokeObjectURL(previewImageUrlRef.current);
      previewImageUrlRef.current = "";
    }
    setPreviewImageUrl("");
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
            const nextFile = new File([blob], filename, { type: "image/png" });
            cachedImageFileRef.current = nextFile;
            if (previewImageUrlRef.current) URL.revokeObjectURL(previewImageUrlRef.current);
            previewImageUrlRef.current = URL.createObjectURL(nextFile);
            setPreviewImageUrl(previewImageUrlRef.current);
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

  useEffect(() => () => {
    if (previewImageUrlRef.current) URL.revokeObjectURL(previewImageUrlRef.current);
  }, []);

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

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex items-center justify-center bg-[#112A46]/45 p-4"
        onClick={onClose}
      >
        <motion.div
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          className="relative z-10 w-full max-w-md max-h-[92%] overflow-y-auto rounded-[28px] bg-[#FBF7ED] p-5 ring-1 ring-[#E8E1D4]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 text-start">
              <h3 className="text-base font-black text-[#112A46]">{labels.myCloseout}</h3>
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
              {shareCaption ? (
                <p className="mt-2 rounded-xl bg-[#FFF4D2] px-2.5 py-1.5 text-taq-nav font-bold leading-relaxed text-[#806528]">
                  {shareCaption}
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
          <div className="relative mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05]">
            {previewData ? (
              <div className="p-2">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt=""
                    className="mx-auto block max-h-[56dvh] w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="mx-auto flex w-fit justify-center">
                    <NotebookDaySharePreview {...previewData} />
                  </div>
                )}
                <div aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0">
                  <div ref={previewRef} className="w-fit">
                    <NotebookDaySharePreview {...previewData} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] w-full items-center justify-center text-xs font-bold text-[#827762]">
                {lang === "ar" ? "لا توجد بيانات للمشاركة" : "Nothing to share"}
              </div>
            )}
            {imageBusy ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8F6F0]/92 text-xs font-bold text-[#827762]">
                {lang === "ar" ? "جاري تجهيز الصورة…" : "Preparing image…"}
              </div>
            ) : null}
            {imageError && !imageBusy ? (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-[#FFF1EE] px-3 py-2 text-center text-taq-nav font-bold text-[#B44747]">
                {imageError}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button type="button" onClick={shareImage} disabled={imageBusy || !previewData} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "مشاركة" : "Share"}
            </button>
            <button type="button" onClick={copyCaptionOnly} disabled={!shareCaption} className="rounded-2xl bg-[#8C7A58] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "نسخ النص" : "Copy caption"}
            </button>
            <button type="button" onClick={downloadImage} disabled={imageBusy || !previewData} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "تنزيل PNG" : "Download PNG"}
            </button>
          </div>
          {shareHint && <p className="mt-3 text-center text-taq-meta font-bold text-[#806528]">{shareHint}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createCloseoutShareImage } from "../daily-closeouts/closeout-share-image";

export default function CloseoutShareModal({
  lang,
  open,
  closeout,
  storeName,
  reviewWorkflowEnabled = true,
  newlySubmitted = false,
  onClose,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!open || !closeout) {
      setPreviewUrl(null);
      setBlob(null);
      setBusy(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    let objectUrl = null;
    setBusy(true);
    setError("");
    setPreviewUrl(null);
    setBlob(null);

    createCloseoutShareImage(closeout, { lang, storeName, reviewWorkflowEnabled })
      .then((nextBlob) => {
        if (cancelled || !nextBlob) return;
        setBlob(nextBlob);
        objectUrl = URL.createObjectURL(nextBlob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setError(lang === "ar" ? "تعذّر تجهيز الصورة" : "Could not prepare image");
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, closeout, lang, storeName, reviewWorkflowEnabled]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const downloadImage = () => {
    if (!previewUrl || !closeout) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `taqfeelah-${closeout.date}.png`;
    link.click();
    showToast(lang === "ar" ? "تم حفظ الصورة" : "Image saved");
  };

  const shareImage = async () => {
    if (!blob || !closeout) return;
    const file = new File([blob], `taqfeelah-${closeout.date}.png`, { type: "image/png" });
    const shareData = {
      title: lang === "ar" ? "تقفيلة اليوم" : "Today's closeout",
      text: `${lang === "ar" ? "تقفيلة اليوم" : "Today's closeout"} — ${storeName}`,
      files: [file],
    };
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
        showToast(lang === "ar" ? "اختر واتساب أو التطبيق لإرسال الصورة" : "Pick WhatsApp or another app");
        return;
      }
    } catch (shareError) {
      if (shareError?.name === "AbortError") return;
    }
    downloadImage();
    showToast(lang === "ar" ? "تم حفظ PNG — يمكنك إرسالها يدويًا عبر واتساب" : "PNG saved — share manually via WhatsApp");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[80] flex items-end justify-center bg-[#112A46]/45 p-4 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24 }}
          animate={{ y: 0 }}
          exit={{ y: 24 }}
          className="relative z-10 w-full max-w-md rounded-[28px] bg-[#FBF7ED] p-5 ring-1 ring-[#E8E1D4]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black">{lang === "ar" ? "مشاركة التقفيلة" : "Share closeout"}</h3>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]">
              <X className="h-4 w-4" />
            </button>
          </div>
          {newlySubmitted && (
            <p className="mb-3 rounded-2xl bg-[#E6F5E9] px-3 py-2 text-[11px] font-bold text-[#257844]">
              {lang === "ar" ? "تم إغلاق اليوم وإرساله — يمكنك مشاركة الصورة الآن" : "Day closed and sent — share the image now"}
            </p>
          )}
          <div className="mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05]">
            {busy ? (
              <div className="flex h-[320px] items-center justify-center text-xs font-bold text-[#827762]">
                {lang === "ar" ? "جاري تجهيز الصورة…" : "Preparing image…"}
              </div>
            ) : error ? (
              <div className="flex h-[320px] items-center justify-center px-4 text-center text-xs font-bold text-[#B44747]">
                {error}
              </div>
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="max-h-[420px] w-full object-contain" />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-xs font-bold text-[#827762]">
                {lang === "ar" ? "لا توجد معاينة" : "No preview"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={shareImage} disabled={busy || !blob || !previewUrl} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "مشاركة / واتساب" : "Share"}
            </button>
            <button type="button" onClick={downloadImage} disabled={busy || !blob || !previewUrl} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "تنزيل PNG" : "Download PNG"}
            </button>
          </div>
          {toast && <p className="mt-3 text-center text-[10px] font-bold text-[#806528]">{toast}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

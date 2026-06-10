"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { captureNotebookShareBlob } from "@/features/daily-closeouts/notebook-share-capture";
import { notebookThemePaperColor } from "@/features/daily-closeouts/notebook-themes";
import OwnerNotebookNoteSharePreview from "@/features/owner-notebook/OwnerNotebookNoteSharePreview";
import {
  buildOwnerNotebookShareCaption,
  formatNoteShareTime,
  ownerNotebookKindLabel,
  ownerNotebookShareFilename,
  shareOwnerNotebookNoteImage,
} from "@/features/owner-notebook/owner-notebook-share";
import { text } from "./prototype-runtime-demo-data";

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function OwnerNotebookShareModal({ lang, note, onClose }) {
  const open = Boolean(note);
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");

  const paperColor = notebookThemePaperColor(note?.color || "yellow");
  const imageFilename = note ? ownerNotebookShareFilename(note, lang) : "daftari-note.png";
  const shareLabels = useMemo(() => ({
    task: text(lang, "ownerNotebookTask"),
    note: text(lang, "ownerNotebookNote"),
    done: text(lang, "ownerNotebookDone"),
  }), [lang]);

  const shareCaption = useMemo(
    () => (note ? buildOwnerNotebookShareCaption(note, lang, shareLabels) : ""),
    [note, lang, shareLabels],
  );

  const previewData = useMemo(() => {
    if (!note) return null;
    return {
      lang,
      theme: note.color || "yellow",
      periodLabel: formatNoteShareTime(note.updatedAt || note.createdAt, lang),
      title: text(lang, "ownerNotebook"),
      kind: note.kind,
      kindLabel: ownerNotebookKindLabel(note, lang, shareLabels),
      done: Boolean(note.done),
      noteText: note.text,
    };
  }, [note, lang, shareLabels]);

  useEffect(() => {
    if (!open) {
      setImageBusy(false);
      setImageError("");
      setShareHint("");
      cachedImageFileRef.current = null;
      return undefined;
    }
    setImageError("");
    setShareHint("");
    cachedImageFileRef.current = null;
    return undefined;
  }, [open, note?.id]);

  useEffect(() => {
    if (!open || !note || !previewData) {
      cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookShareBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], imageFilename, { type: "image/png" });
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
  }, [open, note?.id, previewData, paperColor, imageFilename]);

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
      setImageError(text(lang, "shareImageFailed"));
    } finally {
      setImageBusy(false);
    }
  };

  const downloadImage = () => {
    runImageAction(async (file) => {
      downloadBlobFile(file, imageFilename);
      setShareHint(text(lang, "shareImageSavedHint"));
    });
  };

  const shareImage = () => {
    runImageAction(async (file) => {
      const result = await shareOwnerNotebookNoteImage({
        file,
        caption: shareCaption,
        lang,
        title: text(lang, "ownerNotebook"),
      });
      if (result.method === "clipboard") setShareHint(text(lang, "shareImagePasteHint"));
      else if (result.method === "text-only") setShareHint(text(lang, "shareImageWhatsAppUnavailable"));
      else if (result.method === "share") setShareHint(text(lang, "shareImageWhatsAppPick"));
    });
  };

  if (!open) return null;

  const modal = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex items-center justify-center bg-[#112A46]/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onClick={onClose}
      >
        <motion.div
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          className="relative z-10 flex max-h-[min(88dvh,640px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] bg-[#F8F6F0] shadow-[0_18px_48px_rgba(17,42,70,0.22)] sm:max-w-[700px] sm:rounded-[30px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 text-start">
              <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
              <h3 className="text-base font-black text-[#112A46]">{text(lang, "ownerNotebookSharePreview")}</h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]" aria-label={text(lang, "close")}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mb-2">
            {previewData ? (
              <div ref={previewRef} className="overflow-visible">
                <OwnerNotebookNoteSharePreview {...previewData} fluid />
              </div>
            ) : (
              <div className="flex h-[280px] w-full items-center justify-center rounded-[24px] bg-white text-xs font-bold text-[#827762] ring-1 ring-black/[0.055]">
                {text(lang, "ownerNotebookEmpty")}
              </div>
            )}
            {imageBusy ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8F6F0]/92 text-xs font-bold text-[#827762]">
                {lang === "ar" ? "جاري تجهيز الصورة…" : "Preparing image…"}
              </div>
            ) : null}
          </div>

          <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">{text(lang, "imageReadyToShare")}</p>
          {shareHint ? (
            <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">{shareHint}</p>
          ) : null}
          {imageError ? (
            <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">{imageError}</p>
          ) : null}

          </div>

          <div className="shrink-0 border-t border-[#ECE6DA] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">
                {text(lang, "close")}
              </button>
              <button type="button" onClick={downloadImage} disabled={imageBusy || !previewData} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-50">
                <Download className="h-3.5 w-3.5" />
                {text(lang, "downloadNotebookImage")}
              </button>
              <button type="button" onClick={shareImage} disabled={imageBusy || !previewData} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
                {imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparing…") : text(lang, "shareViaWhatsApp")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

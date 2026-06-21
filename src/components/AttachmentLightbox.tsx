"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildEntryAttachmentShareCaption,
  dataUrlToShareFile,
  shareEntryAttachmentImage,
} from "@/features/entries/client/entry-attachment-share";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_ZOOM = 2.5;

export type AttachmentLightboxShareContext = {
  entry?: Pick<OperationalEntry, "id" | "date"> | null;
  storeName?: string;
  operationLabel?: string;
  entryTime?: string;
  daySequence?: number | null;
  sameDayCloseoutCount?: number;
};

export type AttachmentLightboxProps = {
  open: boolean;
  src: string | null;
  lang?: DisplayLang;
  onClose: () => void;
  shareContext?: AttachmentLightboxShareContext | null;
};

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

function touchDistance(touchA: React.Touch, touchB: React.Touch): number {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}

export default function AttachmentLightbox({
  open,
  src,
  lang = "ar",
  onClose,
  shareContext = null,
}: AttachmentLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sharing, setSharing] = useState(false);
  const shareFileRef = useRef<File | null>(null);
  const gestureRef = useRef({
    mode: "idle" as "idle" | "pinch" | "pan",
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    panStartX: 0,
    panStartY: 0,
    panOriginX: 0,
    panOriginY: 0,
    lastTapAt: 0,
    lastTapX: 0,
    lastTapY: 0,
  });

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) resetView();
  }, [open, src, resetView]);

  useEffect(() => {
    shareFileRef.current = null;
    if (!open || !src || !shareContext) return undefined;
    let cancelled = false;
    dataUrlToShareFile(src, `invoice-${shareContext.entry?.id || "attachment"}`)
      .then((file) => {
        if (!cancelled) shareFileRef.current = file;
      })
      .catch((error) => {
        console.warn("attachment share pre-cache failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, [open, shareContext, src]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touches = event.touches;
    const gesture = gestureRef.current;

    if (touches.length === 2) {
      gesture.mode = "pinch";
      gesture.pinchStartDistance = touchDistance(touches[0], touches[1]);
      gesture.pinchStartZoom = zoom;
      return;
    }

    if (touches.length === 1 && zoom > 1) {
      gesture.mode = "pan";
      gesture.panStartX = touches[0].clientX;
      gesture.panStartY = touches[0].clientY;
      gesture.panOriginX = pan.x;
      gesture.panOriginY = pan.y;
      return;
    }

    if (touches.length === 1) {
      const now = Date.now();
      const touch = touches[0];
      const isDoubleTap =
        now - gesture.lastTapAt <= DOUBLE_TAP_MS
        && Math.abs(touch.clientX - gesture.lastTapX) < 24
        && Math.abs(touch.clientY - gesture.lastTapY) < 24;

      if (isDoubleTap) {
        if (zoom > 1) {
          resetView();
        } else {
          setZoom(DOUBLE_TAP_ZOOM);
        }
        gesture.lastTapAt = 0;
        return;
      }

      gesture.lastTapAt = now;
      gesture.lastTapX = touch.clientX;
      gesture.lastTapY = touch.clientY;
      gesture.mode = "idle";
    }
  }, [pan.x, pan.y, resetView, zoom]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touches = event.touches;
    const gesture = gestureRef.current;

    if (gesture.mode === "pinch" && touches.length === 2 && gesture.pinchStartDistance > 0) {
      event.preventDefault();
      const nextDistance = touchDistance(touches[0], touches[1]);
      const ratio = nextDistance / gesture.pinchStartDistance;
      const nextZoom = clampZoom(gesture.pinchStartZoom * ratio);
      setZoom(nextZoom);
      if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      return;
    }

    if (gesture.mode === "pan" && touches.length === 1) {
      event.preventDefault();
      const touch = touches[0];
      setPan({
        x: gesture.panOriginX + (touch.clientX - gesture.panStartX),
        y: gesture.panOriginY + (touch.clientY - gesture.panStartY),
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    gestureRef.current.mode = "idle";
  }, []);

  const handleShare = useCallback(async () => {
    if (!src || !shareContext || sharing) return;
    setSharing(true);
    try {
      const file = shareFileRef.current
        || await dataUrlToShareFile(src, `invoice-${shareContext.entry?.id || "attachment"}`);
      const caption = buildEntryAttachmentShareCaption({
        lang,
        storeName: shareContext.storeName || "",
        operationLabel: shareContext.operationLabel || "",
        entryDate: shareContext.entry?.date || "",
        entryTime: shareContext.entryTime || "",
        daySequence: shareContext.daySequence ?? null,
        sameDayCloseoutCount: shareContext.sameDayCloseoutCount ?? 1,
      });
      await shareEntryAttachmentImage({ file, caption, lang });
    } catch (error) {
      console.warn("attachment whatsapp share failed", error);
    } finally {
      setSharing(false);
    }
  }, [lang, shareContext, sharing, src]);

  if (!open || !src) return null;

  const lightbox = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[260] bg-black/75"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="flex h-full w-full flex-col p-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:p-6 sm:pt-[max(1.5rem,env(safe-area-inset-top,0px))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between rounded-t-2xl bg-[#112A46] px-3 py-2 text-white">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextZoom = clampZoom(zoom - ZOOM_STEP);
                  setZoom(nextZoom);
                  if (nextZoom <= 1) setPan({ x: 0, y: 0 });
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-50"
                disabled={zoom <= MIN_ZOOM}
                aria-label={lang === "ar" ? "تصغير الصورة" : "Zoom out"}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-50"
                disabled={zoom >= MAX_ZOOM}
                aria-label={lang === "ar" ? "تكبير الصورة" : "Zoom in"}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-50"
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                aria-label={lang === "ar" ? "إعادة الضبط" : "Reset zoom"}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span className="px-1 text-taq-meta font-bold tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            {shareContext ? (
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-taq-nav font-black text-white disabled:opacity-60"
                aria-label={lang === "ar" ? "إرسال الفاتورة واتساب" : "Send invoice on WhatsApp"}
              >
                <Send className="h-4 w-4" />
                <span>{lang === "ar" ? "واتساب" : "WhatsApp"}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#112A46]"
              aria-label={lang === "ar" ? "إغلاق" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-b-2xl bg-[#091423] p-3 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="flex h-full w-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
                className="max-h-full max-w-full select-none object-contain will-change-transform"
                draggable={false}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(lightbox, document.body);
}

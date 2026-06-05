"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

export default function AttachmentLightbox({
  open,
  src,
  lang = "ar",
  onClose,
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open, src]);

  if (!open || !src) return null;

  return (
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
          className="flex h-full w-full flex-col p-3 sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between rounded-t-2xl bg-[#112A46] px-3 py-2 text-white">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
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
                onClick={() => setZoom(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-50"
                disabled={zoom === 1}
                aria-label={lang === "ar" ? "إعادة الضبط" : "Reset zoom"}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span className="px-1 text-taq-meta font-bold tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#112A46]"
              aria-label={lang === "ar" ? "إغلاق" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-b-2xl bg-[#091423] p-3">
            <div className="flex min-h-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{ transform: `scale(${zoom})` }}
                className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
                draggable={false}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

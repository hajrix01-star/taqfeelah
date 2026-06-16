"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, Trash2, X } from "lucide-react";

const VARIANT_STYLES = {
  danger: {
    iconWrap: "bg-[#FFF1EE] text-[#B44747]",
    icon: Trash2,
    confirm: "bg-[#B44747] text-white",
  },
  success: {
    iconWrap: "bg-[#E6F5E9] text-[#257844]",
    icon: Check,
    confirm: "bg-[#257844] text-white",
  },
  warning: {
    iconWrap: "bg-[#FFF4D2] text-[#806528]",
    icon: AlertTriangle,
    confirm: "bg-[#806528] text-white",
  },
  info: {
    iconWrap: "bg-[#E8F0FA] text-[#112A46]",
    icon: Info,
    confirm: "bg-[#112A46] text-white",
  },
};

export function AppActionSheet({
  lang = "ar",
  open = false,
  mode = "alert",
  variant = "info",
  title,
  description = "",
  notice = "",
  confirmLabel,
  cancelLabel,
  onConfirm = () => {},
  onCancel = () => {},
  children = null,
}) {
  if (!open) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = styles.icon;
  const resolvedConfirmLabel = confirmLabel || (lang === "ar" ? "حسنًا" : "OK");
  const resolvedCancelLabel = cancelLabel || (lang === "ar" ? "إلغاء" : "Cancel");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[230] flex items-end bg-[#112A46]/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center"
      >
        <button type="button" onClick={onCancel} className="absolute inset-0" aria-label={resolvedCancelLabel} />
        <motion.div
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="relative z-10 w-full max-w-[560px] rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 shadow-[0_18px_48px_rgba(17,42,70,0.22)] sm:rounded-[30px] sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
              <Icon className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"
              aria-label={resolvedCancelLabel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-base font-black text-[#112A46]">{title}</h3>
          {description ? (
            <p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{description}</p>
          ) : null}
          {children}
          {mode === "confirm" ? (
            <div className={`mt-5 grid gap-3 ${lang === "ar" ? "grid-cols-[0.9fr_1.35fr]" : "grid-cols-[1.35fr_0.9fr]"}`}>
              {lang === "ar" ? (
                <>
                  <button type="button" onClick={onConfirm} className={`rounded-2xl py-3.5 text-xs font-black ${styles.confirm}`}>
                    {resolvedConfirmLabel}
                  </button>
                  <button type="button" onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">
                    {resolvedCancelLabel}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">
                    {resolvedCancelLabel}
                  </button>
                  <button type="button" onClick={onConfirm} className={`rounded-2xl py-3.5 text-xs font-black ${styles.confirm}`}>
                    {resolvedConfirmLabel}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5">
              <button type="button" onClick={onConfirm} className={`w-full rounded-2xl py-3.5 text-xs font-black ${styles.confirm}`}>
                {resolvedConfirmLabel}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

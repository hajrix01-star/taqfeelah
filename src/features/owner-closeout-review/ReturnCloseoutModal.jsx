"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

const QUICK_REASONS = [
  { ar: "صورة ناقصة", en: "Missing photo" },
  { ar: "مبلغ غير واضح", en: "Unclear amount" },
  { ar: "المبيعات غير مطابقة", en: "Sales mismatch" },
  { ar: "ملاحظة أخرى", en: "Other note" },
];

export default function ReturnCloseoutModal({ lang, open, closeout, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open || !closeout) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6">
        <motion.div initial={{ y: 18 }} animate={{ y: 0 }} className="w-full max-w-md rounded-t-[28px] bg-[#F8F6F0] p-5 sm:rounded-[28px]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black">{lang === "ar" ? "إرجاع للتعديل" : "Return for edits"}</h3>
            <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_REASONS.map((item) => (
              <button
                key={item.ar}
                type="button"
                onClick={() => setReason(lang === "ar" ? item.ar : item.en)}
                className={`rounded-full px-3 py-1.5 text-taq-meta font-black ${reason === (lang === "ar" ? item.ar : item.en) ? "bg-[#112A46] text-white" : "bg-white ring-1 ring-[#E8E1D4]"}`}
              >
                {lang === "ar" ? item.ar : item.en}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={lang === "ar" ? "سبب الإرجاع" : "Return reason"}
            className="mb-4 min-h-[80px] w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]"
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onCancel} className="rounded-2xl bg-white py-3 text-xs font-black ring-1 ring-black/[0.06]">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
            <button type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#B44747] py-3 text-xs font-black text-white disabled:opacity-50">{lang === "ar" ? "تأكيد الإرجاع" : "Confirm return"}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

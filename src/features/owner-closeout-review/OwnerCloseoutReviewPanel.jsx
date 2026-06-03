"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { computeCloseoutTotals, salesArrayFromRecord } from "../daily-closeouts/closeout-calculations";
import { closeoutStatusLabel } from "../daily-closeouts/closeout-status";

function money(value, lang) {
  return Number(value || 0).toLocaleString(lang === "ar" ? "en-US" : "en-US");
}

export default function OwnerCloseoutReviewPanel({
  lang,
  closeout,
  formatCalendarDate,
  formatDateTime,
  reviewWorkflowEnabled,
  onClose,
  onApprove,
  onReturn,
}) {
  if (!closeout) return null;
  const totals = closeout.totals || computeCloseoutTotals(closeout.sales, closeout.outflows);
  const salesRows = salesArrayFromRecord(closeout.sales);
  const statusText = closeoutStatusLabel(closeout.status, lang, { reviewWorkflowEnabled });

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[65] flex items-end bg-[#112A46]/40 sm:items-center sm:justify-center sm:p-6">
        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#F8F6F0] p-5 sm:max-w-lg sm:rounded-[28px]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-[#827762]">{closeout.storeName}</p>
              <h3 className="text-lg font-black">{formatCalendarDate(closeout.date, lang)}</h3>
              <p className="mt-1 text-[11px] font-bold text-[#716753]">
                {lang === "ar" ? "أرسلها:" : "Sent by:"} {closeout.submittedByName}
                {closeout.submittedAt ? ` · ${formatDateTime(closeout.submittedAt, lang)}` : ""}
              </p>
              <p className="mt-1 text-[11px] font-black text-[#806528]">{statusText}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button>
          </div>
          <div className="mb-4 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]">
            <p className="text-xs font-black text-[#806528]">{lang === "ar" ? "الداخل" : "Sales"}</p>
            {salesRows.map((row) => (
              <div key={row.channelId} className="flex justify-between text-sm font-bold">
                <span>{row.name}</span>
                <span className="tabular-nums text-[#257844]">{money(row.amount, lang)} ر.س</span>
              </div>
            ))}
            <p className="border-t border-[#F0ECE2] pt-2 text-sm font-black">{lang === "ar" ? "إجمالي الداخل" : "Total in"}: {money(totals.totalSales, lang)} ر.س</p>
          </div>
          <div className="mb-4 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]">
            <p className="text-xs font-black text-[#806528]">{lang === "ar" ? "الخارج" : "Outflows"}</p>
            {(closeout.outflows || []).map((row) => (
              <div key={row.id} className="flex justify-between gap-2 text-sm font-bold">
                <span className="min-w-0 truncate">{row.typeLabel || row.type}{row.category ? ` · ${row.category}` : ""}</span>
                <span className="shrink-0 tabular-nums text-[#B44747]">-{money(row.amount, lang)} ر.س</span>
              </div>
            ))}
            <p className="border-t border-[#F0ECE2] pt-2 text-sm font-black text-[#B44747]">{lang === "ar" ? "إجمالي الخارج" : "Total out"}: {money(totals.totalOutflow, lang)} ر.س</p>
          </div>
          <div className="mb-4 rounded-2xl bg-[#112A46] p-4 text-white">
            <p className="text-[11px] font-bold text-white/70">{lang === "ar" ? "الناتج" : "Net"}</p>
            <p className="text-2xl font-black tabular-nums">{money(totals.netMovement, lang)} ر.س</p>
          </div>
          {(closeout.attachments || []).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(closeout.attachments || []).map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${closeout.id}-rev-${index}`} src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
          )}
          {closeout.status === "submitted" && reviewWorkflowEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onApprove} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white">{lang === "ar" ? "اعتماد التقفيلة" : "Approve"}</button>
              <button type="button" onClick={onReturn} className="rounded-2xl bg-white py-3.5 text-xs font-black text-[#B44747] ring-1 ring-[#B44747]/15">{lang === "ar" ? "إرجاع للتعديل" : "Return"}</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

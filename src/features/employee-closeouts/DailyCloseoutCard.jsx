"use client";

import { ChevronDown } from "lucide-react";
import { computeCloseoutTotals, salesArrayFromRecord } from "../daily-closeouts/closeout-calculations";
import { closeoutStatusLabel, closeoutStatusTone } from "../daily-closeouts/closeout-status";

function money(value, lang) {
  return Number(value || 0).toLocaleString(lang === "ar" ? "en-US" : "en-US");
}

const toneClass = {
  muted: "bg-[#F7F5EF] text-[#716753]",
  pending: "bg-[#FFF4D2] text-[#806528]",
  warning: "bg-[#FFF1EE] text-[#B44747]",
  success: "bg-[#E6F5E9] text-[#257844]",
};

export default function DailyCloseoutCard({
  lang,
  closeout,
  closeoutNumber = 1,
  expanded,
  onToggle,
  onShare,
  onEditResubmit,
  formatDate,
  reviewWorkflowEnabled,
}) {
  const totals = closeout.totals || computeCloseoutTotals(closeout.sales, closeout.outflows);
  const salesRows = salesArrayFromRecord(closeout.sales);
  const statusText = closeoutStatusLabel(closeout.status, lang, {
    reviewWorkflowEnabled,
    autoRecorded: !closeout.reviewedByName && closeout.status === "reviewed",
  });
  const tone = closeoutStatusTone(closeout.status);
  const attachmentCount = (closeout.attachments || []).length;

  return (
    <article className={`overflow-hidden rounded-[19px] border border-[#E8E1D4] bg-[rgba(255,252,244,0.94)] shadow-[0_8px_22px_rgba(17,42,70,0.08)] ${expanded ? "" : ""}`}>
      <div className="relative">
        <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 px-4 py-4 text-start text-sm font-extrabold text-[#112A46]">
          <span className="flex items-center gap-2">
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
            <span className="flex flex-col text-start leading-tight">
              <span>{formatDate(closeout.date)}</span>
              <small className="mt-1 text-[10px] font-black text-[#82745A]">
                {lang === "ar" ? `تقفيلة رقم ${closeoutNumber}` : `Closeout #${closeoutNumber}`}
              </small>
            </span>
          </span>
          <span className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass[tone]}`}>{statusText}</span>
        </button>
        <div className="mx-3.5 mb-3.5 grid grid-cols-4 overflow-hidden rounded-[14px] border border-[#E8E1D4] bg-[rgba(255,252,245,0.72)]">
          {[
            { label: lang === "ar" ? "الداخل" : "In", value: money(totals.totalSales, lang), className: "text-[#112A46]" },
            { label: lang === "ar" ? "الخارج" : "Out", value: money(totals.totalOutflow, lang), className: "text-[#BA4742]" },
            { label: lang === "ar" ? "الناتج" : "Net", value: money(totals.netMovement, lang), className: totals.netMovement < 0 ? "text-[#BA4742]" : "text-[#26784C]" },
            { label: lang === "ar" ? "صور" : "Photos", value: String(attachmentCount), className: "text-[#112A46]" },
          ].map((stat, index) => (
            <div key={stat.label} className={`min-w-0 border-s border-[#E8E1D4] px-1 py-3 text-center ${index === 0 ? "border-s-0" : ""}`}>
              <span className="mb-1.5 block text-taq-meta font-bold text-[#82745A]">{stat.label}</span>
              <strong className={`flex items-end justify-center text-[clamp(1.05rem,3.8vw,1.7rem)] leading-none font-extrabold tabular-nums ${stat.className}`}>
                <span dir="ltr" className="max-w-full whitespace-nowrap">{stat.value}</span>
              </strong>
            </div>
          ))}
        </div>
        <p className="mx-3.5 -mt-1 mb-3 text-center text-[10px] font-bold text-[#82745A]">
          {lang === "ar" ? "قيم الداخل والخارج والناتج بالريال السعودي" : "In/Out/Net values are in SAR"}
        </p>
        {(closeout.outflows || []).length > 0 && !expanded ? (
          <p className="mx-3.5 mb-2 text-taq-nav font-bold text-[#806528]">
            {lang === "ar"
              ? `${(closeout.outflows || []).length} عملية خارج — اضغط اليوم لعرض التفاصيل`
              : `${(closeout.outflows || []).length} outflow item(s) — tap the day to view details`}
          </p>
        ) : null}
        {expanded && salesRows.length > 0 ? (
          <div className="mx-3.5 mb-2 space-y-1 border-t border-dashed border-[#E8E1D4] pt-2">
            <p className="text-taq-nav font-black text-[#806528]">{lang === "ar" ? "قنوات الداخل" : "Sales channels"}</p>
            {salesRows.map((row) => (
              <div key={row.channelId} className="flex items-center justify-between gap-2 text-taq-meta font-bold">
                <span className="truncate text-[#716753]">{row.name}</span>
                <span className="shrink-0 tabular-nums text-[#257844]">{money(row.amount, lang)} ر.س</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShare();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#112A46]/5 py-2.5 text-taq-meta font-black text-[#112A46]"
          >
            <span>↗</span>
            {lang === "ar" ? "إعادة إرسال كصورة عبر واتساب" : "Reshare image via WhatsApp"}
          </button>
        </div>
        {expanded && (
          <div className="space-y-3 border-t border-[#F0ECE2] px-4 py-4">
            <div className={`flex items-center justify-center gap-2 border-y border-[#E8E1D4] py-3 text-xs font-bold text-[#82745A] ${closeout.status === "reviewed" ? "text-[#257844]" : ""}`}>
              <span className={`h-2 w-2 rounded-full ${closeout.status === "reviewed" ? "bg-[#257844]" : closeout.status === "returned" ? "bg-[#B44747]" : "bg-[#D69C2F]"}`} />
              {statusText}
            </div>
            {closeout.status === "returned" && closeout.returnReason && (
              <div className="rounded-2xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">
                {lang === "ar" ? "سبب الإرجاع:" : "Return reason:"} {closeout.returnReason}
                {onEditResubmit && (
                  <button type="button" onClick={onEditResubmit} className="mt-3 w-full rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">
                    {lang === "ar" ? "تعديل وإعادة إرسال" : "Edit and resend"}
                  </button>
                )}
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-black text-[#806528]">{lang === "ar" ? "تفاصيل الداخل" : "Sales"}</p>
              {salesRows.length ? salesRows.map((row) => (
                <div key={row.channelId} className="flex justify-between py-1 text-sm font-bold">
                  <span>{row.name}</span>
                  <span className="tabular-nums text-[#257844]">{money(row.amount, lang)} ر.س</span>
                </div>
              )) : <p className="text-xs font-bold text-[#827762]">{lang === "ar" ? "لا يوجد" : "None"}</p>}
            </div>
            <div>
              <p className="mb-2 text-xs font-black text-[#806528]">{lang === "ar" ? "تفاصيل الخارج" : "Outflows"}</p>
              {(closeout.outflows || []).length ? (closeout.outflows || []).map((row) => (
                <div key={row.id} className="flex justify-between gap-2 py-1 text-sm font-bold">
                  <span className="min-w-0 truncate">{row.typeLabel || row.type}{row.category ? ` · ${row.category}` : ""}{row.note ? ` — ${row.note}` : ""}</span>
                  <span className="shrink-0 tabular-nums text-[#B44747]">-{money(row.amount, lang)} ر.س</span>
                </div>
              )) : <p className="text-xs font-bold text-[#827762]">{lang === "ar" ? "لا يوجد" : "None"}</p>}
            </div>
            {attachmentCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {(closeout.attachments || []).filter(Boolean).map((src, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`${closeout.id}-att-${index}`} src={src} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/[0.06]" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

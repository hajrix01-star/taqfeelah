"use client";

import { formatDisplayMoneyFromRiyals } from "@/core/money/format-display-money";
import { TAQFEELAH_LOGO_SRC } from "@/lib/brand/taqfeelah-logo";
import { resolveAppFontFamily } from "@/core/fonts/app-font-family";
import { notebookLinesBackground, notebookThemes } from "./notebook-themes";
import type { CloseoutShareOperationRow, CloseoutSyncLang, NotebookSharePreviewProps } from "./daily-closeouts-types";

function formatAmount(value: number, lang: CloseoutSyncLang, tone = "default") {
  const suffix = lang === "ar" ? "ر.س" : "SAR";
  const color = tone === "sale" ? "#257844" : tone === "out" ? "#B44747" : tone === "net-pos" ? "#257844" : tone === "net-neg" ? "#B44747" : "#112A46";
  const formatted = formatDisplayMoneyFromRiyals(value, lang);
  return (
    <span dir="ltr" className="whitespace-nowrap tabular-nums font-bold" style={{ color }}>
      {`${formatted} ${suffix}`}
    </span>
  );
}

function SummaryGridRow({
  label,
  children,
  labelClass = "text-[#112A46]",
}: {
  label: string;
  children: React.ReactNode;
  labelClass?: string;
}) {
  return (
    <>
      <div className="flex min-h-[42px] items-end pb-2 text-sm font-medium">
        <span className={labelClass}>{label}</span>
      </div>
      <div className="flex min-h-[42px] min-w-[92px] items-end justify-end pb-2 text-sm">{children}</div>
    </>
  );
}

/**
 * Notebook share card — layout tuned for html-to-image capture (grid rows, no clipped flex).
 */
export default function NotebookDaySharePreview({
  lang = "ar",
  theme = "yellow",
  pattern = "lined",
  fluid = false,
  periodLabel,
  title,
  storeName = "",
  employeeName = "",
  captionFooter = "",
  labels,
  record,
  operations = [],
  showOutflowRatio = false,
}: NotebookSharePreviewProps) {
  const activeTheme = notebookThemes[theme as keyof typeof notebookThemes] || notebookThemes.yellow;
  const lines = notebookLinesBackground(theme, pattern);
  const fontFamily = resolveAppFontFamily(lang);
  const captionLines = captionFooter ? captionFooter.split("\n").filter(Boolean) : [];
  const operationRows: CloseoutShareOperationRow[] = operations;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`${fluid ? "w-full" : "w-[390px]"} overflow-visible rounded-[24px] p-0`}
      style={{ backgroundColor: activeTheme.paper, fontFamily }}
    >
      <div className="relative px-5 pb-4 pt-3" style={lines}>
        <div>
          <div className="flex min-h-[54px] items-center justify-center">
            {/* Kept as a plain image because this DOM subtree is captured directly into a shareable bitmap. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TAQFEELAH_LOGO_SRC} alt="" draggable={false} className="h-[44px] w-[132px] select-none object-contain" />
          </div>
          <div className="flex min-h-[44px] items-end justify-center pb-2 text-taq-meta font-black text-[#112A46]">
            <span>{periodLabel}</span>
          </div>
          <div className="flex flex-col items-center pb-3 text-center">
            <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{title}</p>
            <span className="mt-2 block h-[2px] w-[72px] rounded-full bg-[#C28A30]" />
            {storeName ? (
              <p className="mt-2 text-taq-meta font-bold text-[#806528]">
                {lang === "ar" ? "المحل: " : "Store: "}
                <span className="font-black text-[#112A46]">{storeName}</span>
              </p>
            ) : null}
            {employeeName ? (
              <p className="mt-1 text-taq-meta font-bold text-[#806528]">
                {lang === "ar" ? "الموظف: " : "Employee: "}
                <span className="font-black text-[#112A46]">{employeeName}</span>
              </p>
            ) : null}
          </div>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-end">
            <SummaryGridRow label={labels.sales}>{formatAmount(record.sales, lang, "sale")}</SummaryGridRow>
            <SummaryGridRow label={labels.purchasesExpenses} labelClass="text-[#B44747]">
              {formatAmount(record.expense, lang, "out")}
            </SummaryGridRow>
            {showOutflowRatio && record.ratio ? (
              <SummaryGridRow label={labels.outflowRatio || ""} labelClass="text-[#806528] text-xs">
                <span className="text-xs font-bold text-[#B44747]">{record.ratio}</span>
              </SummaryGridRow>
            ) : null}
          </div>

          <div className="mt-1 grid w-full grid-cols-[minmax(0,1fr)_max-content] items-end border-t-2 border-[#112A46]/55 pt-2">
            <div className="flex min-h-[52px] items-end pb-2 text-sm font-bold text-[#112A46]">
              <span>{labels.netMovement}</span>
            </div>
            <div className="flex min-h-[52px] min-w-[92px] items-end justify-end pb-2 text-xl font-extrabold">
              {formatAmount(record.net, lang, record.net < 0 ? "net-neg" : "net-pos")}
            </div>
          </div>

          {operationRows.length > 0 ? (
            <div className="pt-2">
              <p className="mb-2 text-taq-meta font-black text-[#112A46]">
                {labels.operations}
                <span className="mt-1.5 block h-[2px] w-full max-w-[120px] rounded-full bg-[#C28A30]" />
              </p>
              {operationRows.map((item) => (
                <div
                  key={item.id}
                  className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-start gap-3 py-2.5"
                >
                  <div className="min-w-[80px] pt-0.5">
                    {item.isSale ? (
                      formatAmount(item.amount, lang, "sale")
                    ) : (
                      <span dir="ltr" className="whitespace-nowrap tabular-nums text-taq-meta font-black text-[#B44747]">
                        {`-${formatDisplayMoneyFromRiyals(item.amount, lang)} ${lang === "ar" ? "ر.س" : "SAR"}`}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 text-end">
                    <p className="text-taq-meta font-bold leading-snug text-[#112A46]">{item.label}</p>
                    {item.meta ? <p className="mt-0.5 text-taq-nav font-bold leading-snug text-[#8A816F]">{item.meta}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {captionLines.length > 0 ? (
        <div className="border-t border-[#E8E1D4] bg-[#F7F3E8] px-4 py-3 text-center">
          {captionLines.map((line) => (
            <p key={line} className="text-taq-meta font-black leading-relaxed text-[#112A46]">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

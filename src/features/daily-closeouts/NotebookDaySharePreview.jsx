"use client";

import { notebookLinesBackground, notebookThemes } from "./notebook-themes";

const TAQFEELAH_LOGO_PNG = "data:image/png;base64,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";

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatAmount(value, lang, tone = "default") {
  const suffix = lang === "ar" ? "ر.س" : "SAR";
  const color = tone === "sale" ? "#257844" : tone === "out" ? "#B44747" : tone === "net-pos" ? "#257844" : tone === "net-neg" ? "#B44747" : "#112A46";
  return (
    <span dir="ltr" className="whitespace-nowrap tabular-nums font-bold" style={{ color }}>
      {`${money(value)} ${suffix}`}
    </span>
  );
}

function SummaryGridRow({ label, children, labelClass = "text-[#112A46]" }) {
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
  periodLabel,
  title,
  storeName = "",
  employeeName = "",
  captionFooter = "",
  labels,
  record,
  operations = [],
}) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  const lines = notebookLinesBackground(theme);
  const fontFamily = lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif";
  const captionLines = captionFooter ? captionFooter.split("\n").filter(Boolean) : [];

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="w-[390px] overflow-visible rounded-[24px] p-0"
      style={{ backgroundColor: activeTheme.paper, fontFamily }}
    >
      <div className="relative px-5 pb-4 pt-3" style={lines}>
        <div
          className={`absolute bottom-0 top-0 w-[1.25px] ${lang === "ar" ? "right-8" : "left-8"}`}
          style={{ backgroundColor: activeTheme.margin }}
        />
        <div className={lang === "ar" ? "pr-6 pl-1" : "pl-6 pr-1"}>
          <div className="flex min-h-[54px] items-center justify-center">
            <img src={TAQFEELAH_LOGO_PNG} alt="" draggable={false} className="h-[44px] w-[132px] select-none object-contain" />
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
            <SummaryGridRow label={labels.outflowRatio} labelClass="text-[#806528] text-xs">
              <span className="text-xs font-bold text-[#B44747]">{record.ratio}</span>
            </SummaryGridRow>
          </div>

          <div className="mt-1 grid w-full grid-cols-[minmax(0,1fr)_max-content] items-end border-t-2 border-[#112A46]/55 pt-2">
            <div className="flex min-h-[52px] items-end pb-2 text-sm font-bold text-[#112A46]">
              <span>{labels.netMovement}</span>
            </div>
            <div className="flex min-h-[52px] min-w-[92px] items-end justify-end pb-2 text-xl font-extrabold">
              {formatAmount(record.net, lang, record.net < 0 ? "net-neg" : "net-pos")}
            </div>
          </div>

          {operations.length > 0 ? (
            <div className="pt-2">
              <p className="mb-2 text-taq-meta font-black text-[#112A46]">
                {labels.operations}
                <span className="mt-1.5 block h-[2px] w-full max-w-[120px] rounded-full bg-[#C28A30]" />
              </p>
              {operations.map((item) => (
                <div
                  key={item.id}
                  className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-start gap-3 py-2.5"
                >
                  <div className="min-w-[80px] pt-0.5">
                    {item.isSale ? (
                      formatAmount(item.amount, lang, "sale")
                    ) : (
                      <span dir="ltr" className="whitespace-nowrap tabular-nums text-taq-meta font-black text-[#B44747]">
                        {`-${money(item.amount)} ${lang === "ar" ? "ر.س" : "SAR"}`}
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

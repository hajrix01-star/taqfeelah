"use client";

import { motion } from "framer-motion";
import { BookMarked, Home, Plus, ReceiptText, Settings } from "lucide-react";
import {
  MARKETING_CARD_RADIUS,
  MARKETING_CARD_RING,
  MARKETING_EQUATION,
  MARKETING_EXPENSE,
  MARKETING_GOLD,
  MARKETING_INCOME,
  MARKETING_INK,
  MARKETING_MUTED,
  MARKETING_TAGLINE,
} from "@/features/marketing/marketing-brand";
import {
  MarketingBrandWordmark,
  MarketingNotebookSurface,
} from "@/features/marketing/marketing-ui";

const previewMovements = [
  { label: "كاش", value: "٤٬٢٥٠", type: "in" as const },
  { label: "شبكة", value: "٦٬١٠٠", type: "in" as const },
  { label: "مشتريات", value: "١٬٨٤٠", type: "out" as const },
];

const summary = {
  in: "١٢٬١٩٠",
  out: "٣٬٤٥٠",
  balance: "٨٬٧٤٠",
};

export default function MarketingAppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="mx-auto w-full max-w-[360px]"
    >
      <div
        className={`overflow-hidden ${MARKETING_CARD_RADIUS} bg-white p-2 shadow-[0_28px_70px_rgba(17,42,70,0.14)] ${MARKETING_CARD_RING}`}
        aria-hidden
      >
        <div className="overflow-hidden rounded-[22px] ring-1 ring-black/[0.04]">
          <header className="flex items-center justify-center border-b border-[#ECE6DA]/80 bg-[#F8F6F0] px-4 py-3">
            <MarketingBrandWordmark size="compact" />
          </header>

          <MarketingNotebookSurface minHeight="340px">
            <p className="text-taq-meta font-black" style={{ color: MARKETING_GOLD }}>
              ملخص اليوم
            </p>
            <p className="mt-1 text-lg font-black" style={{ color: MARKETING_INK }}>
              {MARKETING_EQUATION}
            </p>

            <div className="mt-5 space-y-1.5">
              {previewMovements.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1">
                  <span className="text-taq-meta font-bold" style={{ color: MARKETING_MUTED }}>
                    {row.label}
                  </span>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: row.type === "in" ? MARKETING_INCOME : MARKETING_EXPENSE }}
                    dir="ltr"
                  >
                    {row.type === "out" ? "−" : ""}
                    {row.value} ر.س
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#112A46]/10 pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <SummaryCell label="داخل" value={summary.in} color={MARKETING_INCOME} />
                <SummaryCell label="خارج" value={summary.out} color={MARKETING_EXPENSE} />
                <SummaryCell label="الباقي" value={summary.balance} color={MARKETING_INK} highlight />
              </div>
            </div>

            <p className="mt-5 text-center text-[0.7rem] font-black" style={{ color: MARKETING_GOLD }}>
              {MARKETING_TAGLINE}
            </p>
          </MarketingNotebookSurface>

          <nav
            className="grid grid-cols-5 items-center border-t border-[#ECE6DA] bg-white/95 px-2 py-2"
            style={{ color: MARKETING_INK }}
          >
            <PreviewNavItem icon={Home} label="الرئيسية" active />
            <PreviewNavItem icon={BookMarked} label="التقارير" />
            <PreviewNavItem icon={Plus} label="إضافة" highlight />
            <PreviewNavItem icon={ReceiptText} label="السجل" />
            <PreviewNavItem icon={Settings} label="الإعدادات" />
          </nav>
        </div>
      </div>
      <p className="mt-3 text-center text-taq-meta font-bold" style={{ color: MARKETING_MUTED }}>
        من الدفتر للجوال — نفس روح التطبيق
      </p>
    </motion.div>
  );
}

function SummaryCell({
  label,
  value,
  color,
  highlight = false,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-2 py-3 ${highlight ? "bg-[#112A46] text-white" : "bg-white/70 ring-1 ring-black/[0.04]"}`}
    >
      <p
        className="text-[0.65rem] font-bold"
        style={{ color: highlight ? "rgba(255,255,255,0.75)" : MARKETING_MUTED }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-black tabular-nums"
        style={{ color: highlight ? "#fff" : color }}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function PreviewNavItem({
  icon: Icon,
  label,
  active = false,
  highlight = false,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          highlight ? "bg-[#F5A623] text-[#112A46]" : active ? "text-[#112A46]" : "text-[#A99D87]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className={`text-[0.62rem] font-black ${active ? "text-[#112A46]" : "text-[#A99D87]"}`}>
        {label}
      </span>
    </div>
  );
}

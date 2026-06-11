"use client";

import { motion } from "framer-motion";
import { BookMarked, Home, Plus, ReceiptText, Settings } from "lucide-react";
import { TAQFEELAH_LOGO_SRC } from "@/lib/brand/taqfeelah-logo";
import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import {
  MARKETING_CARD_RADIUS,
  MARKETING_CARD_RING,
  MARKETING_GOLD,
  MARKETING_INK,
  MARKETING_MUTED,
  MARKETING_SHELL_BG,
} from "@/features/marketing/marketing-brand";

const previewRows = [
  { label: "كاش", value: "٤٬٢٥٠" },
  { label: "شبكة", value: "٦٬١٠٠" },
  { label: "توصيل", value: "١٬٨٤٠" },
];

export default function MarketingAppPreview() {
  const notebookStyle = notebookLinesBackground("softYellow");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="mx-auto w-full max-w-[340px]"
    >
      <div
        className={`overflow-hidden ${MARKETING_CARD_RADIUS} bg-white p-2 shadow-[0_28px_70px_rgba(17,42,70,0.14)] ${MARKETING_CARD_RING}`}
        aria-hidden
      >
        <div className="overflow-hidden rounded-[22px] ring-1 ring-black/[0.04]">
          <header
            className="flex items-center justify-center px-4 pb-3 pt-4"
            style={{ backgroundColor: MARKETING_SHELL_BG }}
          >
            <img
              src={TAQFEELAH_LOGO_SRC}
              alt=""
              draggable={false}
              className="h-[44px] w-[132px] select-none object-contain"
            />
          </header>

          <div className="relative min-h-[320px] px-4 pb-4 pt-2" style={notebookStyle}>
            <p className="text-taq-meta font-black" style={{ color: MARKETING_GOLD }}>
              ملخص اليوم
            </p>
            <p className="mt-1 text-lg font-black" style={{ color: MARKETING_INK }}>
              الداخل − الخارج = الناتج
            </p>

            <div className="mt-4 space-y-2">
              {previewRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl bg-white/75 px-3 py-2 ring-1 ring-black/[0.04]"
                >
                  <span className="text-taq-meta font-bold" style={{ color: MARKETING_MUTED }}>
                    {row.label}
                  </span>
                  <span className="text-sm font-black" style={{ color: MARKETING_INK }} dir="ltr">
                    {row.value} ر.س
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/80 px-2 py-3 ring-1 ring-black/[0.04]">
                <p className="text-[0.65rem] font-bold" style={{ color: MARKETING_MUTED }}>
                  داخل
                </p>
                <p className="mt-1 text-sm font-black" style={{ color: MARKETING_INK }} dir="ltr">
                  ١٢٬١٩٠
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 px-2 py-3 ring-1 ring-black/[0.04]">
                <p className="text-[0.65rem] font-bold" style={{ color: MARKETING_MUTED }}>
                  خارج
                </p>
                <p className="mt-1 text-sm font-black" style={{ color: MARKETING_INK }} dir="ltr">
                  ٣٬٤٥٠
                </p>
              </div>
              <div className="rounded-2xl bg-[#112A46] px-2 py-3 text-white">
                <p className="text-[0.65rem] font-bold text-white/75">ناتج</p>
                <p className="mt-1 text-sm font-black" dir="ltr">
                  ٨٬٧٤٠
                </p>
              </div>
            </div>
          </div>

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
        معاينة من واجهة التطبيق المعتمدة
      </p>
    </motion.div>
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
          highlight ? "bg-[#112A46] text-white" : active ? "text-[#112A46]" : "text-[#A99D87]"
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

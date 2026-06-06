"use client";

import { motion } from "framer-motion";

const copy = {
  ar: {
    modeTitle: "وضع الدخول التجريبي",
    modeSubtitle: "Prototype Access Mode — للتطوير فقط",
    owner: "دخول كمالك",
    employee: "دخول كموظف",
    notice:
      "هذا الوضع مؤقت لتطوير المنتج. سيتم استبداله لاحقًا بمصادقة وصلاحيات حقيقية قبل الإطلاق.",
  },
  en: {
    modeTitle: "Prototype Access Mode",
    modeSubtitle: "Development-only role picker",
    owner: "Enter as owner",
    employee: "Enter as employee",
    notice:
      "Temporary product-development mode. Real auth and authorization will replace this before launch.",
  },
};

export default function PrototypeAccessScreen({ lang, setLang, onOwner, onEmployee }) {
  const t = copy[lang === "en" ? "en" : "ar"];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[100dvh] flex-col px-6 pb-8 pt-10"
    >
      <div className="flex justify-end">
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05]">
          <button
            type="button"
            onClick={() => setLang("ar")}
            className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}
          >
            ع
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-taq-meta font-black uppercase tracking-wide text-[#B99844]">{t.modeSubtitle}</p>
        <h1 className="mt-3 text-2xl font-black text-[#112A46]">{t.modeTitle}</h1>
      </div>

      <div className="mt-10 space-y-3 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        <button
          type="button"
          onClick={onOwner}
          className="w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white"
        >
          {t.owner}
        </button>
        <button
          type="button"
          onClick={onEmployee}
          className="w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white"
        >
          {t.employee}
        </button>
      </div>

      <p className="mx-auto mt-6 max-w-[320px] text-center text-taq-meta font-bold leading-6 text-[#827762]">
        {t.notice}
      </p>
    </motion.section>
  );
}

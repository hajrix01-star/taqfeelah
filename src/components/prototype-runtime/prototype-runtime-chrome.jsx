"use client";

import React from "react";

const TAQFEELAH_LOGO_PNG = "data:image/png;base64,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";

function Logo({ compact = false, centered = false }) {
  return (
    <div className={`shrink-0 ${centered ? "flex justify-center" : "flex items-center"}`}>
      <img
        src={TAQFEELAH_LOGO_PNG}
        alt="تقفيلة - TAQFEELAH"
        draggable={false}
        className={`select-none object-contain ${compact ? "h-[44px] w-[132px]" : "h-[68px] w-[176px]"}`}
      />
    </div>
  );
}

function LanguageSwitch({ lang, setLang }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/[0.05]">
      <button onClick={() => setLang("ar")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "ar" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>ع</button>
      <button onClick={() => setLang("en")} className={`rounded-full px-1.5 py-1 text-taq-meta font-black ${lang === "en" ? "bg-[#112A46] text-white" : "text-[#827762]"}`}>EN</button>
    </div>
  );
}


export { Logo, LanguageSwitch };

"use client";

export default function LanguageSwitch({ lang, setLang }) {
  return (
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
  );
}

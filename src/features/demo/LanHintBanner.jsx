"use client";

import { useEffect, useState } from "react";

/** Shows LAN URLs on login when opened from localhost (desktop) so user can copy to phone. */
export default function LanHintBanner({ lang = "ar" }) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const onDesktopDev = host === "localhost" || host === "127.0.0.1";
    if (!onDesktopDev) return;

    fetch("/api/lan-hint", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.urls)) setUrls(data.urls);
      })
      .catch(() => {});
  }, []);

  if (!urls.length) return null;

  const primary = urls[0];

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#C9B896] bg-[#FFF9EA] p-3 text-center">
      <p className="text-[10px] font-black text-[#806528]">
        {lang === "ar" ? "للفتح من الجوال (نفس الواي‑فاي)" : "Open on phone (same Wi‑Fi)"}
      </p>
      <a
        href={primary}
        dir="ltr"
        className="mt-2 block break-all text-[11px] font-black text-[#112A46] underline"
      >
        {primary}
      </a>
      <p className="mt-2 text-[9px] font-bold leading-5 text-[#827762]">
        {lang === "ar"
          ? "لا تستخدم localhost على الجوال. إن لم يفتح: pnpm firewall:allow ثم أعد المحاولة."
          : "Do not use localhost on your phone. If it fails, run pnpm firewall:allow on the PC."}
      </p>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { APP_BUILD_STAMP } from "@/app-build-stamp.mjs";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-reference-data";
import { APP_IN_PRODUCTION_MODE } from "@/components/taqfeelah-app/taqfeelah-app-boot";
import { openWhatsAppSupport } from "@/components/taqfeelah-app/taqfeelah-app-support";
import type { AuthLang } from "@/features/auth/client/auth-client-types";

type HelpCenterSheetProps = {
  lang: AuthLang;
  open: boolean;
  onClose: () => void;
};

export function HelpCenterSheet({ lang, open, onClose }: HelpCenterSheetProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6">
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="relative z-10 w-full max-w-md rounded-t-[28px] bg-[#F8F6F0] p-5 sm:rounded-[28px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black">{text(lang, "helpCenterTitle")}</h3>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "helpCenterBody")}</p>
          <ReleaseVersionLine
            className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]"
            lang={lang}
            showBuild
          />
          {!APP_IN_PRODUCTION_MODE ? (
            <p className="mt-2 text-center text-taq-meta font-bold text-[#827762]">
              {text(lang, "appBuildLabel")}: <span dir="ltr">{APP_BUILD_STAMP}</span>
            </p>
          ) : null}
          <button type="button" onClick={() => { openWhatsAppSupport(lang); onClose(); }} className="mt-4 w-full rounded-2xl bg-[#25D366] py-3.5 text-xs font-black text-white">{text(lang, "whatsappSupport")}</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { motion } from "framer-motion";
import { UserRound, Users } from "lucide-react";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-reference-data";
import type { AuthLangProps } from "@/features/auth/client/auth-client-types";
import { LanguageSwitch, Logo } from "@/components/taqfeelah-app/taqfeelah-app-chrome";

type AuthGatewayScreenProps = AuthLangProps & {
  onOwnerPortal: () => void;
  onEmployeePortal: () => void;
};

export function AuthGatewayScreen({ lang, setLang, onOwnerPortal, onEmployeePortal }: AuthGatewayScreenProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="taq-page-gutter flex min-h-[800px] flex-col pb-8 pt-10"
    >
      <div className="flex justify-end">
        <LanguageSwitch lang={lang} setLang={setLang} />
      </div>
      <div className="mt-16 flex justify-center">
        <Logo />
      </div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "loginGatewayTitle")}</h1>
        <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[#827762]">
          {text(lang, "loginGatewaySubtitle")}
        </p>
      </div>
      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onOwnerPortal}
          className="flex w-full items-center gap-3 rounded-[22px] bg-[#112A46] px-4 py-4 text-start text-white shadow-[0_10px_24px_rgba(17,42,70,0.16)] transition active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12">
            <UserRound className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">{text(lang, "ownerLogin")}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onEmployeePortal}
          className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-start text-[#112A46] shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF7F1] text-[#257844]">
            <Users className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">{text(lang, "employeeLogin")}</span>
          </span>
        </button>
      </div>
      <ReleaseVersionLine
        className="mt-6 text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}

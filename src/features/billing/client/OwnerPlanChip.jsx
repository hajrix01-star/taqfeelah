"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { pickLocalizedPlanName } from "@/features/billing/client/subscription-display";
import { OwnerPlanPickerModal } from "./OwnerPlanPickerModal";

export function OwnerPlanChip({
  lang,
  entitlements,
  entitlementsLoading,
  ownerProfile,
  ownerAccount,
}) {
  const [open, setOpen] = React.useState(false);

  if (entitlementsLoading) {
    return (
      <div className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-[#F0ECE2]" />
    );
  }

  if (!entitlements) return null;

  const planName = pickLocalizedPlanName(entitlements, lang);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-[52vw] shrink-0 items-center gap-1 rounded-full bg-[#112A46] px-3 py-1.5 text-[10px] font-black text-white sm:max-w-none"
      >
        <span className="truncate">{planName}</span>
        {entitlements.isTrialPlan ? (
          <span className="shrink-0 rounded-md bg-[#E4B84A] px-1.5 py-0.5 text-[8px] font-black text-[#112A46]">
            {lang === "ar" ? "ترقية" : "Upgrade"}
          </span>
        ) : null}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-80" />
      </button>

      <OwnerPlanPickerModal
        lang={lang}
        open={open}
        onClose={() => setOpen(false)}
        entitlements={entitlements}
        ownerProfile={ownerProfile}
        ownerAccount={ownerAccount}
      />
    </>
  );
}

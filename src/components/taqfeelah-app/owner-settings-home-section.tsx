"use client";

import { motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, CreditCard, ReceiptText, Smartphone, UserRound } from "lucide-react";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { formatPlanSubscriptionHomeLabel } from "@/features/billing/client/subscription-display";
import { countEmployeeSeats } from "@/features/billing/client/entitlement-guards";
import { text } from "./taqfeelah-app-catalog-data";
import { SettingsLink } from "./owner-settings-ui-primitives";
import type { OwnerSettingsSectionCommonProps, AppBusiness } from "./taqfeelah-app-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

export function OwnerSettingsHomeSection({
  lang,
  ownerProfile,
  activeStoredBusinesses,
  visibleStaff,
  notebookTheme,
  setSection,
  onLogout,
  entitlements,
  entitlementsLoading,
}: OwnerSettingsSectionCommonProps & {
  ownerProfile: Record<string, unknown>;
  activeStoredBusinesses: AppBusiness[];
  visibleStaff: StaffMember[];
  notebookTheme: string;
  onLogout: () => void;
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
}) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const storeCountLabel = entitlements
    ? String(entitlements.usage.activeStores)
    : String(activeStoredBusinesses.length);
  const teamCountLabel = entitlements
    ? String(countEmployeeSeats(entitlements.usage))
    : String(visibleStaff.length);
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <div className="mb-5">
        <p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p>
        <h1 className="text-xl font-black">{text(lang, "settings")}</h1>
      </div>
      <button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{String(ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner"))}</p>
          <p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p>
        </div>
        <Arrow className="h-4 w-4 shrink-0 text-[#B99844]" />
      </button>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p>
      <div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={storeCountLabel} onClick={() => setSection("stores")} />
        <SettingsLink lang={lang} icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={teamCountLabel} onClick={() => setSection("team")} />
        <SettingsLink
          lang={lang}
          icon={CreditCard}
          title={text(lang, "subscriptionDetails")}
          value={
            entitlementsLoading
              ? text(lang, "subscriptionLoading")
              : (formatPlanSubscriptionHomeLabel(entitlements, lang) || text(lang, "subscription"))
          }
          onClick={() => setSection("subscription")}
          border={false}
        />
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p>
      <div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} />
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} />
        <SettingsLink lang={lang} icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} />
      </div>
      <ReleaseVersionLine
        className="mt-6 text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}

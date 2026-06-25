"use client";

import { FileText, Smartphone } from "lucide-react";
import { text } from "./taqfeelah-app-demo-data";
import { SettingsLink, SettingsPageHeader } from "./owner-settings-ui-primitives";
import { OwnerSettingsSubscriptionSection } from "./owner-settings-subscription-section";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type { OwnerSettingsSectionCommonProps } from "./taqfeelah-app-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

export function OwnerSettingsSupportSection({
  lang,
  setSection,
  onOpenSupport,
  onOpenHelp,
  embedded = false,
  entitlements = null,
  entitlementsLoading = false,
  entitlementsError = "",
  reloadEntitlements = () => {},
  ownerProfile = null,
}: OwnerSettingsSectionCommonProps & {
  onOpenSupport?: () => void;
  onOpenHelp?: () => void;
  entitlements?: ResolvedOrganizationEntitlements | null;
  entitlementsLoading?: boolean;
  entitlementsError?: string;
  reloadEntitlements?: () => void | Promise<void>;
  ownerProfile?: Record<string, unknown> | null;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "support")} onBack={() => setSection("stores-team")} lang={lang} />
      ) : null}
      <OwnerSettingsSubscriptionSection
        lang={lang}
        setSection={setSection}
        entitlements={entitlements}
        entitlementsLoading={entitlementsLoading}
        entitlementsError={entitlementsError}
        reloadEntitlements={reloadEntitlements}
        ownerProfile={ownerProfile ?? {}}
        onOpenSupport={onOpenSupport}
        embedded
        hideUpgradeActions
      />
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={() => onOpenSupport?.()} border />
        <SettingsLink lang={lang} icon={FileText} title={text(lang, "helpCenter")} onClick={() => onOpenHelp?.()} border={false} />
      </div>
    </SettingsSectionFrame>
  );
}

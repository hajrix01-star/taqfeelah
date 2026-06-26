"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { OwnerPlanChip } from "@/features/billing/client/OwnerPlanChip";
import { text } from "./taqfeelah-app-catalog-data";
import { SettingsLink } from "./owner-settings-ui-primitives";
import { renderOwnerSettingsSection } from "./owner-settings-section-views";
import {
  resolveSettingsMainTab,
  sectionFromSettingsTabs,
  normalizeSettingsSection,
  normalizeStoreSettingsPanel,
} from "./owner-settings-tab-navigation";
import {
  resolveSettingsMainTabItem,
  SettingsMainTabs,
  SettingsTabbedPanel,
} from "./owner-settings-tab-primitives";
import type { OwnerSettingsTabbedShellProps, OwnerSettingsViewState } from "./taqfeelah-app-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

export function OwnerSettingsTabbedShell({ state, callbacks }: OwnerSettingsTabbedShellProps) {
  const { onLogout } = callbacks;
  const {
    lang,
    section,
    setSection,
    cancelManagingTeam,
    entitlements,
    entitlementsLoading,
    ownerProfile,
    ownerAccount,
  } = state;

  const normalizedSection = normalizeSettingsSection(section);
  const mainTab = resolveSettingsMainTab(normalizedSection);
  const mainItem = resolveSettingsMainTabItem(lang, mainTab);
  const panelSection = mainTab === "stores-team" ? normalizedSection : sectionFromSettingsTabs(mainTab);

  const handleMainTabChange = (nextMainTab: string) => {
    if (nextMainTab === mainTab) return;
    if (mainTab === "stores-team" && nextMainTab !== "stores-team") {
      cancelManagingTeam?.();
    }
    setSection(sectionFromSettingsTabs(nextMainTab));
  };

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#112A46]">{text(lang, "settings")}</h1>
          <p className="mt-1 text-[11px] font-bold text-[#827762]">
            {lang === "ar" ? "إدارة المنشأة والحساب" : "Organization and account management"}
          </p>
        </div>
        <OwnerPlanChip
          lang={lang}
          entitlements={entitlements as ResolvedOrganizationEntitlements | null}
          entitlementsLoading={entitlementsLoading}
          ownerProfile={ownerProfile}
          ownerAccount={ownerAccount}
        />
      </div>

      <SettingsTabbedPanel
        sticky
        surfaceClass={mainItem.contentSurfaceClass}
        accentClass={mainItem.contentAccentClass}
        tabs={(
          <SettingsMainTabs
            lang={lang}
            value={mainTab}
            onChange={handleMainTabChange}
            ariaLabel={text(lang, "settings")}
            integrated
          />
        )}
      >
        {renderOwnerSettingsSection(panelSection, state as unknown as OwnerSettingsViewState, callbacks, { embedded: true })}

        {mainTab === "help" ? (
          <div className="mt-3 overflow-hidden rounded-2xl bg-white/90 ring-1 ring-black/[0.045]">
            <SettingsLink
              lang={lang}
              icon={UserRound}
              title={text(lang, "logout")}
              onClick={onLogout}
              danger
              border={false}
            />
          </div>
        ) : null}
      </SettingsTabbedPanel>

      <ReleaseVersionLine
        className="text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}

export function resolveStorePanelForTabs(storePanel: string) {
  return normalizeStoreSettingsPanel(storePanel);
}

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { countEmployeeSeats } from "@/features/billing/client/entitlement-guards";
import { text } from "./prototype-runtime-demo-data";
import { SettingsLink } from "./owner-settings-ui-primitives";
import { renderOwnerSettingsSection } from "./owner-settings-section-views";
import {
  resolveSettingsMainTab,
  resolveSettingsOrgSubTab,
  sectionFromSettingsTabs,
  normalizeStoreSettingsPanel,
} from "./owner-settings-tab-navigation";
import {
  resolveSettingsMainTabItem,
  resolveSettingsOrgSubTabItem,
  SettingsMainTabs,
  SettingsOrgSubTabs,
  SettingsTabbedPanel,
} from "./owner-settings-tab-primitives";

export function OwnerSettingsTabbedShell({ state, callbacks }) {
  const { onLogout } = callbacks;
  const {
    lang,
    section,
    setSection,
    cancelManagingTeam,
    activeStoredBusinesses,
    visibleStaff,
    entitlements,
  } = state;

  const mainTab = resolveSettingsMainTab(section);
  const orgSubTab = resolveSettingsOrgSubTab(section);

  const orgCounts = useMemo(() => ({
    stores: entitlements
      ? entitlements.usage.activeStores
      : activeStoredBusinesses.length,
    team: entitlements
      ? countEmployeeSeats(entitlements.usage)
      : visibleStaff.length,
  }), [entitlements, activeStoredBusinesses.length, visibleStaff.length]);

  const mainItem = resolveSettingsMainTabItem(lang, mainTab);
  const orgItem = resolveSettingsOrgSubTabItem(lang, orgCounts, orgSubTab);
  const contentItem = mainTab === "organization" ? orgItem : mainItem;

  const handleMainTabChange = (nextMainTab) => {
    if (nextMainTab === mainTab) return;
    if (mainTab === "organization" && nextMainTab !== "organization") {
      cancelManagingTeam?.();
    }
    setSection(sectionFromSettingsTabs(nextMainTab, orgSubTab));
  };

  const handleOrgSubTabChange = (nextOrgSubTab) => {
    if (nextOrgSubTab === orgSubTab) return;
    if (orgSubTab === "team" && nextOrgSubTab !== "team") {
      cancelManagingTeam?.();
    }
    setSection(nextOrgSubTab);
  };

  const panelSection = mainTab === "organization"
    ? orgSubTab
    : sectionFromSettingsTabs(mainTab, orgSubTab);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <div className="mb-4">
        <p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p>
        <h1 className="text-xl font-black text-[#112A46]">{text(lang, "settings")}</h1>
        <p className="mt-1 text-[11px] font-bold text-[#827762]">
          {lang === "ar" ? "إدارة المنشأة والحساب" : "Organization and account management"}
        </p>
      </div>

      <SettingsTabbedPanel
        sticky
        surfaceClass={contentItem.contentSurfaceClass}
        accentClass={contentItem.contentAccentClass}
        tabs={(
          <SettingsMainTabs
            lang={lang}
            value={mainTab}
            onChange={handleMainTabChange}
            ariaLabel={text(lang, "settings")}
            integrated
          />
        )}
        subTabs={mainTab === "organization" ? (
          <SettingsOrgSubTabs
            lang={lang}
            value={orgSubTab}
            onChange={handleOrgSubTabChange}
            counts={orgCounts}
            ariaLabel={lang === "ar" ? "أقسام المنشأة" : "Organization sections"}
            integrated
          />
        ) : null}
      >
        {renderOwnerSettingsSection(panelSection, state, callbacks, { embedded: true })}

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

export function resolveStorePanelForTabs(storePanel) {
  return normalizeStoreSettingsPanel(storePanel);
}

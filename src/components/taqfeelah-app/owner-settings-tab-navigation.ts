import type { SettingsSection } from "./taqfeelah-app-types";

const LEGACY_SECTION_ALIASES: Record<string, SettingsSection> = {
  home: "stores",
  organization: "stores-team",
};

export function normalizeSettingsSection(section: SettingsSection | null | undefined) {
  if (!section) return "stores-team";
  return LEGACY_SECTION_ALIASES[section] || section;
}

export function resolveSettingsMainTab(section: SettingsSection) {
  const normalized = normalizeSettingsSection(section);
  if (normalized === "stores-team" || normalized === "stores" || normalized === "team") return "stores-team";
  if (normalized === "account") return "account";
  if (normalized === "appearance") return "shape";
  if (normalized === "subscription") return "help";
  if (normalized === "support") return "help";
  return "stores-team";
}

export function sectionFromSettingsTabs(mainTab: string) {
  if (mainTab === "stores-team") return "stores";
  if (mainTab === "account") return "account";
  if (mainTab === "shape") return "appearance";
  if (mainTab === "help") return "support";
  return "stores-team";
}

/** @deprecated Org sub-tabs removed — kept for legacy store panel aliases only */
export function resolveSettingsOrgSubTab(section: string) {
  if (section === "team") return "team";
  return "stores";
}

const STORE_PANEL_ALIASES: Record<string, string> = {
  overview: "profile",
  alerts: "operations",
  staff: "operations",
};

export function normalizeStoreSettingsPanel(panel: string | null | undefined) {
  return STORE_PANEL_ALIASES[panel || ""] || panel || "profile";
}

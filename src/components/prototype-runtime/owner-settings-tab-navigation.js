const LEGACY_SECTION_ALIASES = {
  home: "stores-team",
  stores: "stores-team",
  team: "stores-team",
  subscription: "support",
  organization: "stores-team",
};

export function normalizeSettingsSection(section) {
  if (!section) return "stores-team";
  return LEGACY_SECTION_ALIASES[section] || section;
}

export function resolveSettingsMainTab(section) {
  const normalized = normalizeSettingsSection(section);
  if (normalized === "stores-team") return "stores-team";
  if (normalized === "account") return "account";
  if (normalized === "appearance") return "shape";
  if (normalized === "support") return "help";
  return "stores-team";
}

export function sectionFromSettingsTabs(mainTab) {
  if (mainTab === "stores-team") return "stores-team";
  if (mainTab === "account") return "account";
  if (mainTab === "shape") return "appearance";
  if (mainTab === "help") return "support";
  return "stores-team";
}

/** @deprecated Org sub-tabs removed — kept for legacy store panel aliases only */
export function resolveSettingsOrgSubTab(section) {
  if (section === "team") return "team";
  if (section === "subscription") return "subscription";
  return "stores";
}

const STORE_PANEL_ALIASES = {
  overview: "profile",
  alerts: "operations",
  staff: "operations",
};

export function normalizeStoreSettingsPanel(panel) {
  return STORE_PANEL_ALIASES[panel] || panel || "profile";
}

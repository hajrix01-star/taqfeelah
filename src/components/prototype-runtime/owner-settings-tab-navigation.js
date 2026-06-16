const ORGANIZATION_SECTIONS = new Set(["home", "stores", "team", "subscription"]);

export function resolveSettingsMainTab(section) {
  if (section === "account") return "account";
  if (section === "appearance") return "app";
  if (section === "support") return "help";
  if (ORGANIZATION_SECTIONS.has(section)) return "organization";
  return "organization";
}

export function resolveSettingsOrgSubTab(section) {
  if (section === "team") return "team";
  if (section === "subscription") return "subscription";
  return "stores";
}

export function sectionFromSettingsTabs(mainTab, orgSubTab = "stores") {
  if (mainTab === "organization") return orgSubTab;
  if (mainTab === "account") return "account";
  if (mainTab === "app") return "appearance";
  if (mainTab === "help") return "support";
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

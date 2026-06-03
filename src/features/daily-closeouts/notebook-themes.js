export const notebookThemes = {
  yellow: {
    paper: "#F7DE85",
    line: "rgba(66,90,111,0.14)",
    margin: "rgba(204,105,96,0.46)",
    shadow: "0 12px 24px rgba(160,118,31,0.16)",
    ring: false,
  },
  softYellow: {
    paper: "#FFF0B8",
    line: "rgba(66,90,111,0.12)",
    margin: "rgba(204,105,96,0.44)",
    shadow: "0 12px 24px rgba(160,118,31,0.11)",
    ring: false,
  },
  ivory: {
    paper: "#FFF8E8",
    line: "rgba(84,116,154,0.13)",
    margin: "rgba(204,105,96,0.42)",
    shadow: "0 12px 24px rgba(120,96,53,0.09)",
    ring: true,
  },
  white: {
    paper: "#FFFDF8",
    line: "rgba(84,116,154,0.15)",
    margin: "rgba(204,105,96,0.45)",
    shadow: "0 12px 24px rgba(17,42,70,0.08)",
    ring: true,
  },
  greenTint: {
    paper: "#EEF2DF",
    line: "rgba(62,91,84,0.13)",
    margin: "rgba(204,105,96,0.41)",
    shadow: "0 12px 24px rgba(64,88,70,0.09)",
    ring: true,
  },
};

export function notebookLinesBackground(theme) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  return {
    backgroundColor: activeTheme.paper,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
}

export function resolveNotebookTheme({ storeOperationalSettings, storeId, globalTheme, employeeThemeOverride }) {
  if (employeeThemeOverride) return employeeThemeOverride;
  const storeTheme = storeOperationalSettings?.[storeId]?.notebookTheme;
  if (storeTheme) return storeTheme;
  return globalTheme || "yellow";
}

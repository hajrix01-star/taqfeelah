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

function blendHex(hex, targetHex, ratio) {
  const parse = (value) => {
    const normalized = value.replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(targetHex);
  const mix = (from, to) => Math.round(from + (to - from) * ratio);
  const channel = (value) => value.toString(16).padStart(2, "0");
  return `#${channel(mix(r1, r2))}${channel(mix(g1, g2))}${channel(mix(b1, b2))}`;
}

export function notebookLinesBackground(theme) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  return {
    backgroundColor: activeTheme.paper,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
}

/** Slightly lighter than notebook paper so cards read as surfaces on the page. */
export function notebookCardBackground(theme, variant = "card") {
  const paper = (notebookThemes[theme] || notebookThemes.yellow).paper;
  const ratio = variant === "inset" ? 0.34 : 0.2;
  return blendHex(paper, "#FFFFFF", ratio);
}

export function applyNotebookThemeCssVariables(themeKey) {
  if (typeof document === "undefined") return;
  const activeTheme = notebookThemes[themeKey] || notebookThemes.yellow;
  document.documentElement.style.setProperty("--taq-notebook-paper", activeTheme.paper);
  document.documentElement.style.setProperty("--taq-shell-bg", activeTheme.paper);
}

export function isValidNotebookTheme(themeKey) {
  return typeof themeKey === "string" && Object.prototype.hasOwnProperty.call(notebookThemes, themeKey);
}

export function resolveNotebookTheme({ storeOperationalSettings, storeId, globalTheme, employeeThemeOverride }) {
  if (employeeThemeOverride) return employeeThemeOverride;
  const storeTheme = storeOperationalSettings?.[storeId]?.notebookTheme;
  if (storeTheme) return storeTheme;
  return globalTheme || "yellow";
}

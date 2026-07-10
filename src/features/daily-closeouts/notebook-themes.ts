import type { NotebookPatternId, NotebookThemeId } from "./daily-closeouts-types";

export type NotebookThemeStyle = {
  paper: string;
  line: string;
  margin: string;
  shadow: string;
  ring: boolean;
};

export const notebookThemes: Record<NotebookThemeId, NotebookThemeStyle> = {
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
  pureWhite: {
    paper: "#FFFFFF",
    line: "rgba(84,116,154,0.16)",
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
  pinkTint: {
    paper: "#FBE8EF",
    line: "rgba(118,78,96,0.13)",
    margin: "rgba(204,105,96,0.42)",
    shadow: "0 12px 24px rgba(176,96,120,0.09)",
    ring: true,
  },
  blueTint: {
    paper: "#E8F1FA",
    line: "rgba(66,96,130,0.13)",
    margin: "rgba(204,105,96,0.42)",
    shadow: "0 12px 24px rgba(64,100,140,0.09)",
    ring: true,
  },
};

export const NOTEBOOK_THEME_IDS = Object.freeze(Object.keys(notebookThemes) as NotebookThemeId[]);
export const NOTEBOOK_PATTERN_IDS = Object.freeze(["lined", "grid", "blank"] as const);

function blendHex(hex: string, targetHex: string, ratio: number): string {
  const parse = (value: string) => {
    const normalized = value.replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(targetHex);
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio);
  const channel = (value: number) => value.toString(16).padStart(2, "0");
  return `#${channel(mix(r1, r2))}${channel(mix(g1, g2))}${channel(mix(b1, b2))}`;
}

function resolveNotebookPattern(pattern: NotebookPatternId | string | undefined): NotebookPatternId {
  if (pattern === "blank") return "blank";
  return pattern === "grid" ? "grid" : "lined";
}

function notebookPatternBackgroundImage(activeTheme: NotebookThemeStyle, pattern: NotebookPatternId): string {
  if (pattern === "blank") {
    return "none";
  }
  if (pattern === "grid") {
    return [
      `repeating-linear-gradient(180deg, transparent 0px, transparent 21px, ${activeTheme.line} 21px, ${activeTheme.line} 22px)`,
      `repeating-linear-gradient(90deg, transparent 0px, transparent 21px, ${activeTheme.line} 21px, ${activeTheme.line} 22px)`,
    ].join(", ");
  }
  return `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`;
}

export function notebookLinesBackground(
  theme: NotebookThemeId | string,
  pattern: NotebookPatternId | string = "lined",
): {
  backgroundColor: string;
  backgroundImage: string;
} {
  const activeTheme = notebookThemes[theme as NotebookThemeId] || notebookThemes.yellow;
  const activePattern = resolveNotebookPattern(pattern);
  return {
    backgroundColor: activeTheme.paper,
    backgroundImage: notebookPatternBackgroundImage(activeTheme, activePattern),
  };
}

/** Slightly lighter than notebook paper so cards read as surfaces on the page. */
export function notebookCardBackground(theme: NotebookThemeId | string, variant = "card"): string {
  const paper = (notebookThemes[theme as NotebookThemeId] || notebookThemes.yellow).paper;
  const ratio = variant === "inset" ? 0.34 : 0.2;
  return blendHex(paper, "#FFFFFF", ratio);
}

export function applyNotebookThemeCssVariables(themeKey: NotebookThemeId | string): void {
  if (typeof document === "undefined") return;
  const activeTheme = notebookThemes[themeKey as NotebookThemeId] || notebookThemes.yellow;
  document.documentElement.style.setProperty("--taq-notebook-paper", activeTheme.paper);
  document.documentElement.style.setProperty("--taq-shell-bg", activeTheme.paper);
}

export function isValidNotebookTheme(themeKey: unknown): themeKey is NotebookThemeId {
  return typeof themeKey === "string" && Object.prototype.hasOwnProperty.call(notebookThemes, themeKey);
}

export function isValidNotebookPattern(patternKey: unknown): patternKey is NotebookPatternId {
  return patternKey === "lined" || patternKey === "grid" || patternKey === "blank";
}

export function resolveNotebookTheme({
  storeOperationalSettings,
  storeId,
  globalTheme,
  employeeThemeOverride,
}: {
  storeOperationalSettings?: Record<string, { notebookTheme?: NotebookThemeId | string }>;
  storeId?: string;
  globalTheme?: NotebookThemeId | string;
  employeeThemeOverride?: NotebookThemeId | string | null;
}): NotebookThemeId | string {
  if (employeeThemeOverride) return employeeThemeOverride;
  const storeTheme = storeId ? storeOperationalSettings?.[storeId]?.notebookTheme : undefined;
  if (storeTheme) return storeTheme;
  return globalTheme || "yellow";
}

/** Share preview/capture uses the sender's active notebook theme, not a stale closeout snapshot. */
export function resolveShareNotebookTheme(
  senderTheme: NotebookThemeId | string | null | undefined,
  closeoutTheme: NotebookThemeId | string | null | undefined,
): NotebookThemeId | string {
  if (isValidNotebookTheme(senderTheme)) return senderTheme;
  if (isValidNotebookTheme(closeoutTheme)) return closeoutTheme;
  return "yellow";
}

export function notebookThemePaperColor(themeKey: NotebookThemeId | string): string {
  return (notebookThemes[themeKey as NotebookThemeId] || notebookThemes.yellow).paper;
}

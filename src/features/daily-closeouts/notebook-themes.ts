export type NotebookThemeKey = "yellow" | "softYellow" | "ivory" | "white" | "greenTint";

export type NotebookTheme = {
  paper: string;
  line: string;
  margin: string;
  shadow: string;
  ring: boolean;
};

export const notebookThemes: Record<NotebookThemeKey, NotebookTheme> = {
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

function blendHex(hex: string, targetHex: string, ratio: number): string {
  const parse = (value: string): [number, number, number] => {
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

export function notebookLinesBackground(theme: string): { backgroundColor: string; backgroundImage: string } {
  const activeTheme = notebookThemes[theme as NotebookThemeKey] || notebookThemes.yellow;
  return {
    backgroundColor: activeTheme.paper,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
}

/** Slightly lighter than notebook paper so cards read as surfaces on the page. */
export function notebookCardBackground(theme: string, variant: "card" | "inset" = "card"): string {
  const paper = (notebookThemes[theme as NotebookThemeKey] || notebookThemes.yellow).paper;
  const ratio = variant === "inset" ? 0.34 : 0.2;
  return blendHex(paper, "#FFFFFF", ratio);
}

export function applyNotebookThemeCssVariables(themeKey: string): void {
  if (typeof document === "undefined") return;
  const activeTheme = notebookThemes[themeKey as NotebookThemeKey] || notebookThemes.yellow;
  document.documentElement.style.setProperty("--taq-notebook-paper", activeTheme.paper);
  document.documentElement.style.setProperty("--taq-shell-bg", activeTheme.paper);
}

export function isValidNotebookTheme(themeKey: string): themeKey is NotebookThemeKey {
  return Object.prototype.hasOwnProperty.call(notebookThemes, themeKey);
}

type ResolveNotebookThemeInput = {
  storeOperationalSettings: Record<string, { notebookTheme?: string } | undefined> | undefined;
  storeId: string | undefined | null;
  globalTheme: string | undefined;
  employeeThemeOverride: string | null | undefined;
};

export function resolveNotebookTheme({
  storeOperationalSettings,
  storeId,
  globalTheme,
  employeeThemeOverride,
}: ResolveNotebookThemeInput): string {
  if (employeeThemeOverride) return employeeThemeOverride;
  const storeTheme = storeId ? storeOperationalSettings?.[storeId]?.notebookTheme : undefined;
  if (storeTheme) return storeTheme;
  return globalTheme || "yellow";
}


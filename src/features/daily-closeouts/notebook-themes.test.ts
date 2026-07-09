import { describe, expect, it } from "vitest";
import {
  isValidNotebookPattern,
  isValidNotebookTheme,
  NOTEBOOK_THEME_IDS,
  notebookLinesBackground,
  notebookThemePaperColor,
  notebookThemes,
  resolveShareNotebookTheme,
} from "./notebook-themes";

describe("resolveShareNotebookTheme", () => {
  it("prefers the sender theme over a closeout snapshot", () => {
    expect(resolveShareNotebookTheme("ivory", "yellow")).toBe("ivory");
    expect(resolveShareNotebookTheme("greenTint", "softYellow")).toBe("greenTint");
  });

  it("falls back to closeout theme when sender theme is missing or invalid", () => {
    expect(resolveShareNotebookTheme(undefined, "white")).toBe("white");
    expect(resolveShareNotebookTheme("invalid", "softYellow")).toBe("softYellow");
  });

  it("defaults to yellow when neither theme is valid", () => {
    expect(resolveShareNotebookTheme(null, null)).toBe("yellow");
    expect(resolveShareNotebookTheme("bad", "also-bad")).toBe("yellow");
  });
});

describe("notebookThemePaperColor", () => {
  it("returns the paper color for a known theme", () => {
    expect(notebookThemePaperColor("ivory")).toBe(notebookThemes.ivory.paper);
  });

  it("falls back to yellow paper for unknown themes", () => {
    expect(notebookThemePaperColor("unknown")).toBe(notebookThemes.yellow.paper);
  });
});

describe("notebookThemes", () => {
  it("includes pink and blue tint themes with required fields", () => {
    expect(NOTEBOOK_THEME_IDS).toContain("pinkTint");
    expect(NOTEBOOK_THEME_IDS).toContain("blueTint");
    expect(NOTEBOOK_THEME_IDS).toContain("pureWhite");
    expect(isValidNotebookTheme("pinkTint")).toBe(true);
    expect(isValidNotebookTheme("blueTint")).toBe(true);
    expect(isValidNotebookTheme("pureWhite")).toBe(true);
    expect(notebookThemes.pinkTint.paper).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(notebookThemes.blueTint.paper).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(notebookThemes.pureWhite.paper).toBe("#FFFFFF");
  });
});

describe("notebookLinesBackground", () => {
  it("uses lined paper by default", () => {
    expect(notebookLinesBackground("yellow").backgroundImage).toContain("43px");
    expect(notebookLinesBackground("yellow").backgroundImage).not.toContain("90deg");
  });

  it("uses both axes for grid paper", () => {
    const grid = notebookLinesBackground("yellow", "grid");

    expect(isValidNotebookPattern("grid")).toBe(true);
    expect(isValidNotebookPattern("unknown")).toBe(false);
    expect(grid.backgroundColor).toBe(notebookThemes.yellow.paper);
    expect(grid.backgroundImage).toContain("180deg");
    expect(grid.backgroundImage).toContain("90deg");
  });
});

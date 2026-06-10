import { describe, expect, it } from "vitest";
import {
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

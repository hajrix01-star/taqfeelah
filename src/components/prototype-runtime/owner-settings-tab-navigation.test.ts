import { describe, expect, it } from "vitest";
import {
  normalizeSettingsSection,
  normalizeStoreSettingsPanel,
  resolveSettingsMainTab,
  sectionFromSettingsTabs,
} from "./owner-settings-tab-navigation";

describe("owner settings tab navigation", () => {
  it("maps sections to four flat main tabs", () => {
    expect(resolveSettingsMainTab("stores-team")).toBe("stores-team");
    expect(resolveSettingsMainTab("stores")).toBe("stores-team");
    expect(resolveSettingsMainTab("team")).toBe("stores-team");
    expect(resolveSettingsMainTab("account")).toBe("account");
    expect(resolveSettingsMainTab("appearance")).toBe("shape");
    expect(resolveSettingsMainTab("support")).toBe("help");
    expect(resolveSettingsMainTab("subscription")).toBe("help");
  });

  it("normalizes legacy section ids", () => {
    expect(normalizeSettingsSection("home")).toBe("stores-team");
    expect(normalizeSettingsSection("subscription")).toBe("support");
  });

  it("builds section ids from tab selections", () => {
    expect(sectionFromSettingsTabs("stores-team")).toBe("stores-team");
    expect(sectionFromSettingsTabs("shape")).toBe("appearance");
    expect(sectionFromSettingsTabs("help")).toBe("support");
  });

  it("normalizes legacy store panels to tab ids", () => {
    expect(normalizeStoreSettingsPanel("overview")).toBe("profile");
    expect(normalizeStoreSettingsPanel("alerts")).toBe("operations");
    expect(normalizeStoreSettingsPanel("staff")).toBe("operations");
    expect(normalizeStoreSettingsPanel("channels")).toBe("channels");
  });
});

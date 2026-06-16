import { describe, expect, it } from "vitest";
import {
  normalizeStoreSettingsPanel,
  resolveSettingsMainTab,
  resolveSettingsOrgSubTab,
  sectionFromSettingsTabs,
} from "./owner-settings-tab-navigation";

describe("owner settings tab navigation", () => {
  it("maps legacy sections to main tabs", () => {
    expect(resolveSettingsMainTab("stores")).toBe("organization");
    expect(resolveSettingsMainTab("account")).toBe("account");
    expect(resolveSettingsMainTab("appearance")).toBe("app");
    expect(resolveSettingsMainTab("support")).toBe("help");
  });

  it("maps organization sections to sub tabs", () => {
    expect(resolveSettingsOrgSubTab("team")).toBe("team");
    expect(resolveSettingsOrgSubTab("subscription")).toBe("subscription");
    expect(resolveSettingsOrgSubTab("home")).toBe("stores");
  });

  it("builds section ids from tab selections", () => {
    expect(sectionFromSettingsTabs("organization", "team")).toBe("team");
    expect(sectionFromSettingsTabs("app", "stores")).toBe("appearance");
    expect(sectionFromSettingsTabs("help", "stores")).toBe("support");
  });

  it("normalizes legacy store panels to tab ids", () => {
    expect(normalizeStoreSettingsPanel("overview")).toBe("profile");
    expect(normalizeStoreSettingsPanel("alerts")).toBe("operations");
    expect(normalizeStoreSettingsPanel("channels")).toBe("channels");
  });
});

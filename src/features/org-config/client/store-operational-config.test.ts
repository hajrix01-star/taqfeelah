import { describe, expect, it } from "vitest";
import {
  buildInitialStoreOperationalSettings,
  buildStoreOperationalPolicy,
  ensureStoreOperationalSettingsForBusinesses,
  getStoreOperationalConfig,
} from "./store-operational-config";

describe("store operational config helpers", () => {
  it("returns normalized defaults for unknown store", () => {
    expect(getStoreOperationalConfig({}, "shami")).toMatchObject({
      closeoutAlert: false,
      employeeHistoryVisibility: "all",
    });
  });

  it("builds per-store settings from legacy saved settings blob", () => {
    const settings = buildInitialStoreOperationalSettings({
      closeoutAlert: true,
      employeeHistoryVisibility: "week",
    }, [{ id: "shami" }, { id: "arz" }]);

    expect(settings.shami.closeoutAlert).toBe(true);
    expect(settings.shami.employeeHistoryVisibility).toBe("week");
    expect(settings.arz.activeCategories).toContain("rent");
  });

  it("ensures operational settings exist for each configured business", () => {
    const next = ensureStoreOperationalSettingsForBusinesses({}, ["shami"]);
    expect(next.shami).toMatchObject({ closeoutAlert: false });
    expect(ensureStoreOperationalSettingsForBusinesses(next, ["shami"])).toBe(next);
  });

  it("exposes closeout alert policy helper from normalized settings", () => {
    const policy = buildStoreOperationalPolicy({
      shami: { closeoutAlert: true },
      arz: { closeoutAlert: false },
    });

    expect(policy.closeoutAlertEnabledForBusiness("shami")).toBe(true);
    expect(policy.closeoutAlertEnabledForBusiness("arz")).toBe(false);
  });
});

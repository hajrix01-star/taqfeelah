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
      reviewEnabled: false,
      closeoutReviewEnabled: false,
      employeeHistoryVisibility: "all",
    });
  });

  it("builds per-store settings from legacy saved settings blob", () => {
    const settings = buildInitialStoreOperationalSettings({
      reviewEnabled: true,
      closeoutReviewEnabled: true,
    }, [{ id: "shami" }, { id: "arz" }]);

    expect(settings.shami.reviewEnabled).toBe(true);
    expect(settings.shami.closeoutReviewEnabled).toBe(true);
    expect(settings.arz.activeCategories).toContain("rent");
  });

  it("ensures operational settings exist for each configured business", () => {
    const next = ensureStoreOperationalSettingsForBusinesses({}, ["shami"]);
    expect(next.shami).toMatchObject({ reviewEnabled: false });
    expect(ensureStoreOperationalSettingsForBusinesses(next, ["shami"])).toBe(next);
  });

  it("exposes store policy helpers from normalized settings", () => {
    const policy = buildStoreOperationalPolicy({
      shami: { reviewEnabled: true, attachmentAlert: true, closeoutReviewEnabled: true },
    });

    expect(policy.reviewEnabledForBusiness("shami")).toBe(true);
    expect(policy.closeoutReviewEnabledForBusiness("shami")).toBe(true);
    expect(policy.attachmentAlertEnabledForBusiness("shami")).toBe(true);
    expect(policy.attachmentAlertEnabledForBusiness("arz")).toBe(false);
  });
});

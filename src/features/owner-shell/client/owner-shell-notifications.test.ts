import { describe, expect, it } from "vitest";
import {
  buildDuplicateSalesAlerts,
  buildOwnerNotificationState,
  resolveActiveViewBusiness,
} from "./owner-shell-notifications";

describe("owner shell notifications", () => {
  it("does not build duplicate sales alerts under zero-review policy", () => {
    const alerts = buildDuplicateSalesAlerts();

    expect(alerts).toEqual([]);
  });

  it("resolves active view business for single-store owners", () => {
    expect(resolveActiveViewBusiness({
      activeBusinesses: [{ id: "shami" }],
      selectedBusiness: "all",
    })).toBe("shami");
  });

  it("builds owner notification visibility state from closeout alerts only", () => {
    const state = buildOwnerNotificationState({
      closeoutAlerts: [{ id: "c1", businessId: "shami", seen: false }] as Array<{ id: string; businessId: string; seen: boolean }>,
      closeoutAlertEnabledForBusiness: () => true,
    });

    expect(state.ownerNotificationsVisible).toBe(true);
    expect(state.ownerNotificationBadge).toBe(true);
    expect(state.unseenCloseoutAlerts).toHaveLength(1);
  });
});

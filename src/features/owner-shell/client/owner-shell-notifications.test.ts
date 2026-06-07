import { describe, expect, it } from "vitest";
import {
  buildDuplicateSalesAlerts,
  buildOwnerNotificationState,
  buildPendingAttachmentReviews,
  resolveActiveViewBusiness,
} from "./owner-shell-notifications";

describe("owner shell notifications", () => {
  it("builds duplicate sales alerts for unacknowledged groups", () => {
    const alerts = buildDuplicateSalesAlerts({
      operationalEntries: [
        { id: "a1", type: "summary", status: "active", businessId: "shami", date: "2026-06-01" },
        { id: "a2", type: "summary", status: "active", businessId: "shami", date: "2026-06-01" },
      ],
      activeBusinesses: [{ id: "shami" }],
      acknowledgedDuplicateSales: {},
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.entries).toHaveLength(2);
  });

  it("resolves active view business for single-store owners", () => {
    expect(resolveActiveViewBusiness({
      activeBusinesses: [{ id: "shami" }],
      selectedBusiness: "all",
    })).toBe("shami");
  });

  it("builds owner notification visibility state", () => {
    const state = buildOwnerNotificationState({
      duplicateSalesAlerts: [{ businessId: "shami", date: "2026-06-01", entries: [] }] as Array<{ businessId: string; date: string; entries: unknown[] }>,
      pendingAttachmentReviews: [] as Array<{ id: string }>,
      closeoutAlerts: [{ id: "c1", businessId: "shami", seen: false }] as Array<{ id: string; businessId: string; seen: boolean }>,
      closeoutAlertEnabledForBusiness: () => true,
    });

    expect(state.ownerNotificationsVisible).toBe(true);
    expect(state.ownerNotificationBadge).toBe(true);
    expect(state.unseenCloseoutAlerts).toHaveLength(1);
  });

  it("collects pending attachment reviews", () => {
    const pending = buildPendingAttachmentReviews({
      operationalEntries: [
        { id: "e1", status: "active", businessId: "shami", attachment: { id: "a1" }, reviewed: false },
      ],
      activeBusinesses: [{ id: "shami" }],
      attachmentAlertEnabledForBusiness: () => true,
    });

    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe("e1");
  });
});

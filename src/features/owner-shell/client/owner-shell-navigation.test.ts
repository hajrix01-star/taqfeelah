import { describe, expect, it, vi } from "vitest";
import {
  handleOwnerNotificationsClick,
  openOwnerQuickSummary,
  reviewCloseoutAlertRecord,
} from "./owner-shell-navigation";

describe("owner shell navigation", () => {
  it("opens quick summary page", () => {
    const setQuickAddOpen = vi.fn();
    const setOwnerPage = vi.fn();

    openOwnerQuickSummary({ setQuickAddOpen, setOwnerPage });

    expect(setQuickAddOpen).toHaveBeenCalledWith(false);
    expect(setOwnerPage).toHaveBeenCalledWith("add-summary");
  });

  it("reviews closeout alert and selects linked entry", () => {
    const apply = {
      setArchivedReadOnlyBusinessId: vi.fn(),
      setSelectedBusiness: vi.fn(),
      setOwnerPage: vi.fn(),
      setSelected: vi.fn(),
      setCloseoutAlerts: vi.fn((updater) => updater([{ id: "alert-1", seen: false }])),
    };

    reviewCloseoutAlertRecord(
      { id: "alert-1", businessId: "shami", date: "2026-06-01", entryId: "entry-1" },
      apply,
      [{ id: "entry-1", businessId: "shami" }],
    );

    expect(apply.setOwnerPage).toHaveBeenCalledWith("register");
    expect(apply.setSelected).toHaveBeenCalledWith({ id: "entry-1", businessId: "shami" });
  });

  it("routes notifications to duplicate review first", () => {
    const setOwnerPage = vi.fn();

    handleOwnerNotificationsClick({
      duplicateSalesAlerts: [{ businessId: "shami", date: "2026-06-06" }],
      unseenCloseoutAlerts: [],
      apply: {
        setArchivedReadOnlyBusinessId: vi.fn(),
        setSelectedBusiness: vi.fn(),
        setDuplicateReviewFocus: vi.fn(),
        setOwnerPage,
      },
    });

    expect(setOwnerPage).toHaveBeenCalledWith("register");
  });
});

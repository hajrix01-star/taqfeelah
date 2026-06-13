import { describe, expect, it, vi } from "vitest";
import {
  handleOwnerNotificationsClick,
  navigateOwnerPage,
  openOwnerQuickSummary,
  openCloseoutAlertInRegister,
} from "./owner-shell-navigation";

describe("owner shell navigation", () => {
  it("opens quick summary page", () => {
    const setQuickAddOpen = vi.fn();
    const setOwnerPage = vi.fn();

    openOwnerQuickSummary({ setQuickAddOpen, setOwnerPage });

    expect(setQuickAddOpen).toHaveBeenCalledWith(false);
    expect(setOwnerPage).toHaveBeenCalledWith("add-summary");
  });

  it("opens closeout alert in register and selects linked entry", () => {
    const apply = {
      setArchivedReadOnlyBusinessId: vi.fn(),
      setSelectedBusiness: vi.fn(),
      setOwnerPage: vi.fn(),
      setSelected: vi.fn(),
      setCloseoutAlerts: vi.fn((updater) => updater([{ id: "alert-1", seen: false }])),
    };

    openCloseoutAlertInRegister(
      { id: "alert-1", businessId: "shami", date: "2026-06-01", entryId: "entry-1" },
      apply,
      [{ id: "entry-1", businessId: "shami" }],
    );

    expect(apply.setOwnerPage).toHaveBeenCalledWith("register");
    expect(apply.setSelected).toHaveBeenCalledWith({ id: "entry-1", businessId: "shami" });
  });

  it("routes legacy reports page to home", () => {
    const setOwnerPage = vi.fn();

    navigateOwnerPage("reports", { setOwnerPage });

    expect(setOwnerPage).toHaveBeenCalledWith("home");
  });

  it("routes notifications to unseen closeout alerts only", () => {
    const setOwnerPage = vi.fn();

    handleOwnerNotificationsClick({
      unseenCloseoutAlerts: [{ id: "alert-1", businessId: "shami", date: "2026-06-06" }],
      apply: {
        setArchivedReadOnlyBusinessId: vi.fn(),
        setSelectedBusiness: vi.fn(),
        setOwnerPage,
      },
    });

    expect(setOwnerPage).toHaveBeenCalledWith("register");
  });
});

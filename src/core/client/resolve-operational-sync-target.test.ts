import { describe, expect, it } from "vitest";
import {
  resolveOperationalSyncRefreshTarget,
  shouldPauseOperationalSyncRefresh,
  shouldEnableOperationalSyncPolling,
} from "@/core/client/resolve-operational-sync-target";
import { OPERATIONAL_SYNC_BACKGROUND_REFRESH } from "@/core/sync/operational-sync-event-types";

describe("resolveOperationalSyncRefreshTarget", () => {
  it("reloads closeouts and entries for closeout events", () => {
    const target = resolveOperationalSyncRefreshTarget("closeout.submitted");
    expect(target.reloadCloseouts).toBe(true);
    expect(target.reloadEntries).toBe(true);
  });

  it("reloads entries only for entry events", () => {
    const target = resolveOperationalSyncRefreshTarget("entry.created");
    expect(target.reloadCloseouts).toBe(false);
    expect(target.reloadEntries).toBe(true);
  });

  it("reloads both for background refresh", () => {
    const target = resolveOperationalSyncRefreshTarget(OPERATIONAL_SYNC_BACKGROUND_REFRESH);
    expect(target.reloadCloseouts).toBe(true);
    expect(target.reloadEntries).toBe(true);
  });
});

describe("shouldEnableOperationalSyncPolling", () => {
  it("enables owner polling on home", () => {
    expect(shouldEnableOperationalSyncPolling({
      employee: false,
      ownerPage: "home",
      employeePage: "closeouts",
      ownerEntryActive: false,
      employeeEntryActive: false,
      syncEnabled: true,
    })).toBe(true);
  });

  it("disables polling while entry form is active", () => {
    expect(shouldEnableOperationalSyncPolling({
      employee: false,
      ownerPage: "register",
      employeePage: "closeouts",
      ownerEntryActive: true,
      employeeEntryActive: false,
      syncEnabled: true,
    })).toBe(false);
  });

  it("disables owner polling on register so financial figures do not move live", () => {
    expect(shouldEnableOperationalSyncPolling({
      employee: false,
      ownerPage: "register",
      employeePage: "closeouts",
      ownerEntryActive: false,
      employeeEntryActive: false,
      syncEnabled: true,
    })).toBe(false);
  });
});

describe("shouldPauseOperationalSyncRefresh", () => {
  it("pauses remote refreshes on owner register", () => {
    expect(shouldPauseOperationalSyncRefresh({
      employee: false,
      ownerPage: "register",
      employeePage: "closeouts",
      ownerEntryActive: false,
      employeeEntryActive: false,
      syncEnabled: true,
    })).toBe(true);
  });

  it("keeps home eligible for remote refreshes", () => {
    expect(shouldPauseOperationalSyncRefresh({
      employee: false,
      ownerPage: "home",
      employeePage: "closeouts",
      ownerEntryActive: false,
      employeeEntryActive: false,
      syncEnabled: true,
    })).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  applyOwnerSettingsDeleteTarget,
  listStaffWithoutActiveStoreAfterArchive,
  removeEmployeePinForPerson,
  storeHasOperationalRecords,
} from "./owner-settings-delete-actions";

describe("owner settings delete actions", () => {
  it("detects operational records for a store", () => {
    expect(storeHasOperationalRecords([
      { businessId: "shami", type: "summary" },
    ], "shami")).toBe(true);
    expect(storeHasOperationalRecords([], "arz")).toBe(false);
  });

  it("lists staff who would lose all active stores after archive", () => {
    const affected = listStaffWithoutActiveStoreAfterArchive({
      staff: [
        { id: "ahmed", active: true, storeIds: ["shami"] },
        { id: "sara", active: true, storeIds: ["shami", "arz"] },
      ],
      businessId: "shami",
      activeBusinessIds: ["shami", "arz"],
    });

    expect(affected.map((person) => person.id)).toEqual(["ahmed"]);
  });

  it("removes employee pin by person id", () => {
    expect(removeEmployeePinForPerson({ ahmed: "1111", sara: "2222" }, "ahmed")).toEqual({
      sara: "2222",
    });
  });

  it("applies empty store deletion side effects", () => {
    const removeConfiguredBusiness = vi.fn();
    const setSelectedBusiness = vi.fn();
    const clearArchivedReadOnlyBusinessId = vi.fn();
    const closeStore = vi.fn();

    applyOwnerSettingsDeleteTarget({
      deleteTarget: { type: "store", item: { id: "shami" }, hasRecords: false },
      selectedBusiness: "shami",
      apply: {
        removeConfiguredBusiness,
        removeArchivedBusinessId: vi.fn(),
        removeStaffStoreId: vi.fn(),
        removeLastCloseoutDate: vi.fn(),
        setSelectedBusiness,
        clearArchivedReadOnlyBusinessId,
        removeStoreChannelSettings: vi.fn(),
        removeStoreOperationalSettings: vi.fn(),
        closeStore,
      },
    });

    expect(removeConfiguredBusiness).toHaveBeenCalledWith("shami");
    expect(setSelectedBusiness).toHaveBeenCalledWith("all");
    expect(clearArchivedReadOnlyBusinessId).toHaveBeenCalledOnce();
    expect(closeStore).toHaveBeenCalledOnce();
  });

  it("archives store with records instead of deleting configuration", () => {
    const appendArchivedBusinessId = vi.fn();

    applyOwnerSettingsDeleteTarget({
      deleteTarget: { type: "store", item: { id: "shami" }, hasRecords: true },
      selectedBusiness: "all",
      apply: { appendArchivedBusinessId, closeStore: vi.fn() },
    });

    expect(appendArchivedBusinessId).toHaveBeenCalledWith("shami");
  });
});

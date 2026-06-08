import { describe, expect, it } from "vitest";
import { buildEmployeePortalContext } from "./employee-portal-context";

describe("employee portal context", () => {
  it("builds assigned stores and notebook theme for active employee", () => {
    const context = buildEmployeePortalContext({
      employee: true,
      loggedInEmployeeId: "ahmed",
      staff: [{
        id: "ahmed",
        nameAr: "أحمد",
        nameEn: "Ahmed",
        active: true,
        removed: false,
        storeIds: ["shami"],
      }],
      activeBusinesses: [{ id: "shami" }],
      employeeBusinessId: "shami",
      storeChannelSettings: {},
      storeOperationalSettings: { shami: { activeCategories: ["purchases"] } },
      expenseCategories: [{ id: "purchases" }, { id: "other" }],
      lastCloseoutDates: { shami: "2026-06-01" },
      todayDate: "2026-06-07",
      nextDay: (date) => date,
    });

    expect(context.activeEmployee?.id).toBe("ahmed");
    expect(context.assignedEmployeeBusinessIds).toEqual(["shami"]);
    expect(context.currentEmployeeBusiness?.id).toBe("shami");
    expect(context.currentEmployeeChannelConfig).toEqual({ channels: [], activeIds: [] });
    expect(context.currentEmployeeCategories).toEqual([{ id: "purchases" }]);
    expect(context.suggestedEntryDate).toBeTruthy();
  });

  it("falls back to default channel config when store settings are missing", () => {
    const defaultStoreChannelConfig = {
      channels: [{ id: "cash", text: "cash" }],
      activeIds: ["cash"],
    };
    const context = buildEmployeePortalContext({
      employee: true,
      loggedInEmployeeId: "ahmed",
      staff: [{
        id: "ahmed",
        active: true,
        removed: false,
        storeIds: ["shami"],
      }],
      activeBusinesses: [{ id: "shami" }],
      employeeBusinessId: "shami",
      storeChannelSettings: {},
      defaultStoreChannelConfig,
    });

    expect(context.currentEmployeeChannelConfig).toEqual(defaultStoreChannelConfig);
  });
});

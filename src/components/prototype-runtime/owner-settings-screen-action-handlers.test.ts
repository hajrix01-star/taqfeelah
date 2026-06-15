import { describe, expect, it, vi } from "vitest";
import { createOwnerSettingsScreenHandlers } from "./owner-settings-screen-action-handlers";

function buildHandlerContext(overrides: Record<string, unknown> = {}) {
  const setters = {
    setDraftStoreName: vi.fn(),
    setDraftStoreLocation: vi.fn(),
    setDraftStoreChannelConfig: vi.fn(),
    setDraftStoreOperationalConfig: vi.fn(),
    setNewPaymentMethodName: vi.fn(),
    setNewSalesChannelName: vi.fn(),
    setSettingsNotice: vi.fn(),
    setSettingsStoreId: vi.fn(),
    setStorePanel: vi.fn(),
    setConfiguredBusinesses: vi.fn(),
    setStoreChannelSettings: vi.fn(),
    setStoreOperationalSettings: vi.fn(),
    setArchivedBusinessIds: vi.fn(),
    setDeleteTarget: vi.fn(),
    setNewStoreName: vi.fn(),
    setNewStoreLocation: vi.fn(),
    setShowAddStore: vi.fn(),
    setDraftStaff: vi.fn(),
    setManagingTeam: vi.fn(),
    setNewEmployeeName: vi.fn(),
    setNewEmployeeMobile: vi.fn(),
    setNewEmployeeStoreIds: vi.fn(),
    setStaff: vi.fn(),
    setAuthOwnerUsername: vi.fn(),
    setAuthOwnerPassword: vi.fn(),
    setAuthEmployeePins: vi.fn(),
    setDraftAuthEmployeePins: vi.fn(),
    setTeamSaving: vi.fn(),
    setStoreSaving: vi.fn(),
    setSelectedBusiness: vi.fn(),
    setArchivedReadOnlyBusinessId: vi.fn(),
    setLastCloseoutDates: vi.fn(),
    setOwnerProfile: vi.fn(),
  };

  return {
    lang: "ar",
    settingsStoreId: null,
    selectedStore: null,
    selectedBusiness: null,
    displayBusinessName: (business: { nameAr?: string; id: string }) => business.nameAr || business.id,
    displayLocation: () => "",
    savedChannelConfig: { channels: [], activeIds: [] },
    savedOperationalConfig: { activeCategories: [], closeoutAlert: true },
    channelConfig: { channels: [], activeIds: [] },
    operationalConfig: { activeCategories: [], closeoutAlert: true },
    draftStaff: null,
    staff: [],
    managingTeam: false,
    teamSaving: false,
    newEmployeeName: "",
    newEmployeeMobile: "",
    newEmployeeStoreIds: [],
    draftOwnerName: "",
    draftAuthOwnerUsername: "",
    draftAuthOwnerPassword: "",
    draftAuthEmployeePins: {},
    authOwnerUsername: "",
    authOwnerPassword: "",
    authEmployeePins: {},
    ownerProfile: { name: "Owner" },
    newStoreName: "",
    newStoreLocation: "",
    newPaymentMethodName: "",
    newSalesChannelName: "",
    draftStoreName: "",
    draftStoreLocation: "",
    draftStoreChannelConfig: null,
    draftStoreOperationalConfig: null,
    operationalEntries: [],
    activeStoredBusinesses: [{ id: "arz", nameAr: "ARZ" }],
    visibleStaff: [],
    deleteTarget: null,
    entitlements: null,
    reloadEntitlements: vi.fn(),
    orgConfigApiContext: null,
    onPersistSettingsNow: null,
    showSettingsSaved: vi.fn(),
    setters,
    ...overrides,
  };
}

describe("owner settings screen action handlers", () => {
  it("openStore resets channel draft fields and selects the store", () => {
    const ctx = buildHandlerContext();
    const { openStore } = createOwnerSettingsScreenHandlers(ctx);

    expect(() => openStore("arz")).not.toThrow();

    expect(ctx.setters.setNewPaymentMethodName).toHaveBeenCalledWith("");
    expect(ctx.setters.setNewSalesChannelName).toHaveBeenCalledWith("");
    expect(ctx.setters.setSettingsStoreId).toHaveBeenCalledWith("arz");
    expect(ctx.setters.setStorePanel).toHaveBeenCalledWith("overview");
  });
});

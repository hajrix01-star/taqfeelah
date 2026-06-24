import { afterEach, describe, expect, it, vi } from "vitest";
import { createOwnerSettingsScreenHandlers } from "./owner-settings-screen-action-handlers";

const ORIGINAL_ORG_CONFIG_API_ENABLED = process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED;

afterEach(() => {
  process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED = ORIGINAL_ORG_CONFIG_API_ENABLED;
});

function buildHandlerContext(overrides: Record<string, unknown> = {}) {
  const setters = {
    setDraftStoreName: vi.fn(),
    setDraftStoreLocation: vi.fn(),
    setDraftStoreChannelConfig: vi.fn(),
    setDraftStoreOperationalConfig: vi.fn(),
    setNewCustomIncomeSourceName: vi.fn(),
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
    newCustomIncomeSourceName: "",
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

    expect(ctx.setters.setNewCustomIncomeSourceName).toHaveBeenCalledWith("");
    expect(ctx.setters.setSettingsStoreId).toHaveBeenCalledWith("arz");
    expect(ctx.setters.setStorePanel).toHaveBeenCalledWith("profile");
  });

  it("saves employee deactivation through org config API", async () => {
    process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED = "true";
    const flushPersist = vi.fn().mockResolvedValue(undefined);
    const ctx = buildHandlerContext({
      managingTeam: true,
      draftStaff: [{
        id: "55ec4109-d5fa-463f-8c23-7f34d2f8fd0b",
        memberId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        nameAr: "سارة",
        nameEn: "Sara",
        active: false,
        removed: false,
        storeIds: ["7cf1450d-08d8-4ca1-b180-1c2642174a79"],
      }],
      orgConfigApiContext: {
        enabled: true,
        hydrated: true,
        loading: false,
        flushPersist,
      },
    });

    const { saveManagingTeam } = createOwnerSettingsScreenHandlers(ctx);
    await saveManagingTeam();

    expect(flushPersist).toHaveBeenCalledWith(
      {
        staff: [expect.objectContaining({
          id: "55ec4109-d5fa-463f-8c23-7f34d2f8fd0b",
          active: false,
          removed: false,
        })],
      },
      { employeePins: {} },
    );
    expect(ctx.setters.setStaff).toHaveBeenCalledWith([
      expect.objectContaining({ active: false }),
    ]);
    expect(ctx.showSettingsSaved).toHaveBeenCalled();
  });

  it("confirms staff delete as immediate inactive API save", async () => {
    process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED = "true";
    const flushPersist = vi.fn().mockResolvedValue(undefined);
    const staffMember = {
      id: "55ec4109-d5fa-463f-8c23-7f34d2f8fd0b",
      memberId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      nameAr: "سارة",
      nameEn: "Sara",
      active: true,
      removed: false,
      storeIds: ["7cf1450d-08d8-4ca1-b180-1c2642174a79"],
    };
    const ctx = buildHandlerContext({
      staff: [staffMember],
      deleteTarget: { type: "staff", item: staffMember },
      draftAuthEmployeePins: { [staffMember.id]: "1234" },
      authEmployeePins: { [staffMember.id]: "1234" },
      orgConfigApiContext: {
        enabled: true,
        hydrated: true,
        loading: false,
        flushPersist,
      },
    });

    const { confirmDelete } = createOwnerSettingsScreenHandlers(ctx);
    await confirmDelete();

    expect(ctx.setters.setDeleteTarget).toHaveBeenCalledWith(null);
    expect(flushPersist).toHaveBeenCalledWith(
      {
        staff: [expect.objectContaining({
          id: staffMember.id,
          active: false,
          removed: true,
        })],
      },
      { employeePins: {} },
    );
    expect(ctx.setters.setStaff).toHaveBeenCalledWith([
      expect.objectContaining({ active: false, removed: true }),
    ]);
    expect(ctx.showSettingsSaved).toHaveBeenCalled();
  });
});

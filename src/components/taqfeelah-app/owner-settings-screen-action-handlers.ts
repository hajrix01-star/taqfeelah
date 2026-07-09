import { CreditCard } from "lucide-react";
import { createOrganizationStoreViaApi } from "@/features/org-config/client/org-config-api-client";
import {
  buildOwnerProfileUpdate,
  validateOwnerAuthCredentials,
} from "@/features/org-config/client/owner-settings-account-actions";
import { buildOwnerSettingsTeamPersistPayload } from "@/features/org-config/client/owner-settings-local-persistence";
import {
  applyPersistedStoreChannelSettings,
  applyPersistedStoreOperationalSettings,
  applyStoreProfileUpdate,
  buildArchiveStoreDeleteTarget,
  buildNewConfiguredBusiness,
  buildRemoveStoreDeleteTarget,
  toggleArchivedBusinessId,
} from "@/features/org-config/client/owner-settings-store-actions";
import { resolveStorePanelOpenDrafts } from "@/features/org-config/client/owner-settings-store-panel-actions";
import {
  addCustomSalesChannel,
  canRequestRetireSalesChannel,
  cloneStoreChannelDraft,
  deleteCustomSalesChannelInDraft,
  restoreRetiredSalesChannel,
  retireSalesChannelInDraft,
  toggleIncomeSourceActive,
} from "@/features/org-config/client/owner-settings-channel-actions";
import {
  cloneStoreOperationalDraft,
  mergeOperationalDraft,
  toggleOperationalCategory,
} from "@/features/org-config/client/owner-settings-operational-actions";
import {
  buildNewStaffMember,
  canAddStaffMember,
  cloneStaffDraft,
  prepareSavedTeamDraft,
  resolveTeamSaveFailureMessage,
  toggleEmployeeActiveInDraft,
  toggleEmployeeStoreInDraft,
  toggleStoreSelection,
  updateEmployeeMobileInDraft,
} from "@/features/org-config/client/owner-settings-team-actions";
import {
  applyOwnerSettingsDeleteTarget,
  listStaffWithoutActiveStoreAfterArchive,
  removeEmployeePinForPerson,
  storeHasOperationalRecords,
} from "@/features/org-config/client/owner-settings-delete-actions";
import {
  canAddEmployeeSeat,
  canAddStore,
  resolveEmployeeLimitMessage,
  resolveStoreLimitMessage,
} from "@/features/billing/client/entitlement-guards";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { isFlattenedStoreSettingsEnabled } from "@/core/config/owner-settings-store-layout-mode";
import { emptyStoreRecord, text } from "./taqfeelah-app-catalog-data";
import { APP_IN_PRODUCTION_MODE, LOCAL_DEV_EMPLOYEE_PIN_DEFAULT } from "./taqfeelah-app-boot";
import type {
  AppBusiness,
  AppChannel,
  AppSetState,
  DisplayLang,
  OwnerSettingsApiContext,
  OwnerSettingsScreenHandlersContext,
} from "./taqfeelah-app-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type {
  OwnerSettingsDeleteTarget,
  StaffMember,
  StoreChannelConfig,
  StoreOperationalDraft,
} from "@/features/org-config/client/org-config-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

type StoreSettingsMap = Record<string, StoreOperationalSettings>;
type LastCloseoutDates = Record<string, string>;
type DeleteTargetDraft = OwnerSettingsDeleteTarget | null;

type HandlerSetters = Record<string, AppSetState> & {
  setOwnerProfile: (value: unknown) => void;
  setSettingsNotice: (value: unknown) => void;
  setDraftStoreName: (value: unknown) => void;
  setDraftStoreLocation: (value: unknown) => void;
  setDraftStoreChannelConfig: (value: unknown) => void;
  setDraftStoreOperationalConfig: (value: unknown) => void;
  setNewCustomIncomeSourceName: (value: unknown) => void;
  setSettingsStoreId: (value: unknown) => void;
  setStorePanel: (value: unknown) => void;
  setConfiguredBusinesses: (value: unknown) => void;
  setStoreChannelSettings: (value: unknown) => void;
  setStoreOperationalSettings: (value: unknown) => void;
  setArchivedBusinessIds: (value: unknown) => void;
  setDeleteTarget: (value: unknown) => void;
  setNewStoreName: (value: unknown) => void;
  setNewStoreLocation: (value: unknown) => void;
  setShowAddStore: (value: unknown) => void;
  setDraftStaff: (value: unknown) => void;
  setManagingTeam: (value: unknown) => void;
  setNewEmployeeName: (value: unknown) => void;
  setNewEmployeeMobile: (value: unknown) => void;
  setNewEmployeeStoreIds: (value: unknown) => void;
  setStaff: (value: unknown) => void;
  setAuthOwnerUsername: (value: unknown) => void;
  setAuthOwnerPassword: (value: unknown) => void;
  setAuthEmployeePins: (value: unknown) => void;
  setDraftAuthEmployeePins: (value: unknown) => void;
  setTeamSaving: (value: unknown) => void;
  setStoreSaving: (value: unknown) => void;
  setSelectedBusiness: (value: unknown) => void;
  setArchivedReadOnlyBusinessId: (value: unknown) => void;
  setLastCloseoutDates: (value: unknown) => void;
};

type HandlerContext = {
  lang: DisplayLang;
  settingsStoreId: string | null;
  selectedStore: AppBusiness | null;
  selectedBusiness: string;
  displayBusinessName: (business: AppBusiness | Record<string, unknown>) => string;
  displayLocation: (business: AppBusiness | Record<string, unknown>) => string;
  savedChannelConfig: StoreChannelConfig;
  savedOperationalConfig: StoreOperationalDraft;
  channelConfig: StoreChannelConfig;
  operationalConfig: StoreOperationalSettings;
  draftStaff: StaffMember[] | null;
  staff: StaffMember[];
  managingTeam: boolean;
  teamSaving: boolean;
  newEmployeeName: string;
  newEmployeeMobile: string;
  newEmployeeStoreIds: string[];
  draftOwnerName: string;
  draftAuthOwnerUsername: string;
  draftAuthOwnerPassword: string;
  draftAuthEmployeePins: Record<string, string>;
  authOwnerUsername: string;
  authOwnerPassword: string;
  authEmployeePins: Record<string, string>;
  ownerProfile: Record<string, unknown>;
  newStoreName: string;
  newStoreLocation: string;
  newCustomIncomeSourceName: string;
  draftStoreName: string;
  draftStoreLocation: string;
  draftStoreChannelConfig: StoreChannelConfig | null;
  draftStoreOperationalConfig: StoreOperationalDraft | null;
  configuredBusinesses: AppBusiness[];
  storeChannelSettings: Record<string, StoreChannelConfig>;
  storeOperationalSettings: StoreSettingsMap;
  operationalEntries: OperationalEntry[];
  activeStoredBusinesses: AppBusiness[];
  visibleStaff: StaffMember[];
  deleteTarget: DeleteTargetDraft;
  entitlements: ResolvedOrganizationEntitlements | null;
  reloadEntitlements: () => void | Promise<void>;
  orgConfigApiContext: OwnerSettingsApiContext;
  onPersistSettingsNow: ((payload?: Record<string, unknown>) => void | Promise<void>) | null;
  setters: HandlerSetters;
  showSettingsSaved: () => void;
};

export function createOwnerSettingsScreenHandlers(ctx: OwnerSettingsScreenHandlersContext) {
  const dynamicCtx = ctx as HandlerContext;
  const {
    lang,
    settingsStoreId,
    selectedStore,
    selectedBusiness,
    displayBusinessName,
    displayLocation,
    savedChannelConfig,
    savedOperationalConfig,
    channelConfig,
    operationalConfig,
    draftStaff,
    staff,
    managingTeam,
    teamSaving,
    newEmployeeName,
    newEmployeeMobile,
    newEmployeeStoreIds,
    draftOwnerName,
    draftAuthOwnerUsername,
    draftAuthOwnerPassword,
    draftAuthEmployeePins,
    authOwnerUsername,
    authOwnerPassword,
    authEmployeePins,
    ownerProfile,
    newStoreName,
    newStoreLocation,
    newCustomIncomeSourceName,
    draftStoreName,
    draftStoreLocation,
    draftStoreChannelConfig,
    draftStoreOperationalConfig,
    configuredBusinesses,
    storeChannelSettings,
    storeOperationalSettings,
    operationalEntries,
    activeStoredBusinesses,
    visibleStaff,
    deleteTarget,
    entitlements,
    reloadEntitlements,
    orgConfigApiContext,
    onPersistSettingsNow,
    setters,
    showSettingsSaved,
  } = dynamicCtx;

  const toChannelTarget = (channel: AppChannel | Record<string, unknown> | string): { id: string } => (
    typeof channel === "string" ? { id: channel } : { id: String(channel.id || "") }
  );

  const resetStoreDrafts = () => {
    setters.setDraftStoreName("");
    setters.setDraftStoreLocation("");
    setters.setDraftStoreChannelConfig(null);
    setters.setDraftStoreOperationalConfig(null);
    setters.setNewCustomIncomeSourceName("");
    setters.setSettingsNotice("");
  };
  const defaultEmployeePin = APP_IN_PRODUCTION_MODE
    ? LOCAL_DEV_EMPLOYEE_PIN_DEFAULT
    : (LOCAL_DEV_EMPLOYEE_PIN_DEFAULT || "1234");

  const closeStore = () => {
    resetStoreDrafts();
    setters.setSettingsStoreId(null);
    setters.setStorePanel("overview");
  };

  const updateChannelDraft = (updater: (config: StoreChannelConfig) => StoreChannelConfig) => {
    setters.setDraftStoreChannelConfig((current: StoreChannelConfig | null) => updater(current || savedChannelConfig));
  };

  const updateOperationalDraft = (updates: Partial<StoreOperationalSettings>) => {
    setters.setDraftStoreOperationalConfig((current: StoreOperationalDraft | null) => mergeOperationalDraft(current || savedOperationalConfig, updates));
  };

  const staffWithoutActiveStoreAfterArchive = (businessId: string) => listStaffWithoutActiveStoreAfterArchive({
    staff: visibleStaff,
    businessId,
    activeBusinessIds: activeStoredBusinesses.map((business) => business.id),
  });

  const storeHasRecords = (business: AppBusiness | Record<string, unknown>) => storeHasOperationalRecords(operationalEntries, String(business.id));

  const saveOwnerProfile = () => {
    const nextProfile = buildOwnerProfileUpdate(ownerProfile, draftOwnerName);
    if (!nextProfile) return;
    setters.setOwnerProfile(nextProfile);
    showSettingsSaved();
  };

  const saveAuthCredentials = () => {
    const credentials = validateOwnerAuthCredentials(draftAuthOwnerUsername, draftAuthOwnerPassword);
    if (!credentials.valid) {
      setters.setSettingsNotice(lang === "ar" ? "اسم المستخدم وكلمة المرور للمالك مطلوبان." : "Owner username and password are required.");
      return;
    }
    setters.setAuthOwnerUsername(credentials.username);
    setters.setAuthOwnerPassword(credentials.password);
    setters.setAuthEmployeePins(draftAuthEmployeePins || {});
    setters.setSettingsNotice("");
    showSettingsSaved();
  };

  const openStore = (id: string) => {
    resetStoreDrafts();
    setters.setSettingsStoreId(id);
    setters.setStorePanel("profile");
  };

  const openStorePanel = (panel: string) => {
    setters.setSettingsNotice("");
    const normalizedPanel = panel === "operations" ? "alerts" : panel;
    setters.setStorePanel(panel === "operations" ? "operations" : panel);
    const drafts = resolveStorePanelOpenDrafts(normalizedPanel, {
      selectedStore,
      displayBusinessName,
      displayLocation,
      savedChannelConfig,
      savedOperationalConfig,
    });
    if (drafts.profile) {
      setters.setDraftStoreName(drafts.profile.name);
      setters.setDraftStoreLocation(drafts.profile.location);
    }
    if (drafts.channelConfig) setters.setDraftStoreChannelConfig(drafts.channelConfig);
    if (drafts.operationalConfig) setters.setDraftStoreOperationalConfig(drafts.operationalConfig);
  };

  const backFromStorePanel = () => {
    resetStoreDrafts();
    setters.setStorePanel("overview");
  };

  const leaveStorePanelAfterSave = () => {
    if (!isFlattenedStoreSettingsEnabled()) backFromStorePanel();
  };

  const canFlushOrgConfig = () => Boolean(
    isOrgConfigApiEnabled()
    && orgConfigApiContext?.enabled
    && orgConfigApiContext.hydrated
    && !orgConfigApiContext.loading
    && typeof orgConfigApiContext.flushPersist === "function",
  );

  const cancelChannelDraft = () => {
    setters.setDraftStoreChannelConfig(cloneStoreChannelDraft(savedChannelConfig));
    setters.setSettingsNotice("");
  };

  const cancelOperationalDraft = () => {
    setters.setDraftStoreOperationalConfig(cloneStoreOperationalDraft(savedOperationalConfig));
    setters.setSettingsNotice("");
  };

  const saveStoreProfile = async () => {
    if (!settingsStoreId || !draftStoreName.trim()) return;
    const nextConfiguredBusinesses = applyStoreProfileUpdate(configuredBusinesses || [], settingsStoreId, {
      name: draftStoreName,
      location: draftStoreLocation,
    });

    if (isOrgConfigApiEnabled()) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        const flushPersist = orgConfigApiContext?.flushPersist;
        if (!flushPersist) throw new Error("org config persistence unavailable");
        await flushPersist({
          configuredBusinesses: nextConfiguredBusinesses,
        });
      } catch {
        setters.setSettingsNotice(
          lang === "ar"
            ? "تعذر حفظ بيانات المحل على الخادم. أعد المحاولة."
            : "Could not save shop details on the server. Please retry.",
        );
        return;
      } finally {
        setters.setStoreSaving(false);
      }
      setters.setDraftStoreName("");
      setters.setDraftStoreLocation("");
      showSettingsSaved();
      leaveStorePanelAfterSave();
      return;
    }

    setters.setConfiguredBusinesses(nextConfiguredBusinesses);
    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const saveChannelSettings = async () => {
    if (!settingsStoreId || !draftStoreChannelConfig) return;

    const nextStoreChannelSettings = applyPersistedStoreChannelSettings(
      storeChannelSettings || {},
      settingsStoreId,
      draftStoreChannelConfig,
    );

    if (isOrgConfigApiEnabled()) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      try {
        setters.setStoreSaving(true);
        setters.setSettingsNotice("");
        const flushPersist = orgConfigApiContext?.flushPersist;
        if (!flushPersist) throw new Error("org config persistence unavailable");
        await flushPersist({
          storeChannelSettings: nextStoreChannelSettings as Record<string, StoreChannelConfig>,
        });
      } catch {
        setters.setSettingsNotice(
          lang === "ar"
            ? "تعذر حفظ طرق الدفع على الخادم. أعد المحاولة."
            : "Could not save income channels on the server. Please retry.",
        );
        return;
      } finally {
        setters.setStoreSaving(false);
      }
      setters.setDraftStoreChannelConfig(null);
      showSettingsSaved();
      leaveStorePanelAfterSave();
      return;
    }

    setters.setStoreChannelSettings(nextStoreChannelSettings);
    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const saveOperationalSettings = async () => {
    if (!settingsStoreId || !draftStoreOperationalConfig) return;
    const nextStoreOperationalSettings = applyPersistedStoreOperationalSettings(
      storeOperationalSettings || {},
      settingsStoreId,
      draftStoreOperationalConfig,
    );

    if (isOrgConfigApiEnabled()) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        const flushPersist = orgConfigApiContext?.flushPersist;
        if (!flushPersist) throw new Error("org config persistence unavailable");
        await flushPersist({
          storeOperationalSettings: nextStoreOperationalSettings,
        });
      } catch {
        setters.setSettingsNotice(
          lang === "ar"
            ? "تعذر حفظ إعدادات التشغيل على الخادم. أعد المحاولة."
            : "Could not save operating settings on the server. Please retry.",
        );
        return;
      } finally {
        setters.setStoreSaving(false);
      }
      setters.setDraftStoreOperationalConfig(null);
      showSettingsSaved();
      leaveStorePanelAfterSave();
      return;
    }

    setters.setStoreOperationalSettings(nextStoreOperationalSettings);
    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const toggleChannel = (id: string) => {
    const result = toggleIncomeSourceActive(channelConfig, id);
    if (result.blocked) {
      setters.setSettingsNotice(text(lang, "atLeastOneChannel"));
      return;
    }
    setters.setSettingsNotice("");
    updateChannelDraft(() => result.config);
  };

  const requestRetireChannel = (channel: AppChannel | Record<string, unknown> | string) => {
    const channelTarget = toChannelTarget(channel);
    if (!canRequestRetireSalesChannel(channelConfig, channelTarget)) {
      setters.setSettingsNotice(text(lang, "atLeastOneChannel"));
      return;
    }
    setters.setDeleteTarget({ type: "channel", item: channelTarget });
  };

  const restoreSalesChannel = (channel: AppChannel | Record<string, unknown> | string) => updateChannelDraft((config) => restoreRetiredSalesChannel(config, toChannelTarget(channel)));
  const deleteCustomIncomeSource = (channel: AppChannel | Record<string, unknown> | string) => updateChannelDraft((config) => deleteCustomSalesChannelInDraft(config, toChannelTarget(channel)));

  const addCustomIncomeSource = (names?: { nameAr?: string; nameEn?: string }) => {
    const result = addCustomSalesChannel(channelConfig, {
      nameAr: names?.nameAr ?? newCustomIncomeSourceName,
      nameEn: names?.nameEn ?? newCustomIncomeSourceName,
    }, {
      icon: CreditCard,
      kind: "payment_method",
    });
    if (!result.added) return;
    setters.setDraftStoreChannelConfig(result.config);
    setters.setNewCustomIncomeSourceName("");
  };

  const toggleCategory = (id: string) => {
    const result = toggleOperationalCategory(operationalConfig, id);
    if (result.blocked) {
      setters.setSettingsNotice(text(lang, "atLeastOneCategory"));
      return;
    }
    setters.setSettingsNotice("");
    setters.setDraftStoreOperationalConfig(result.config);
  };

  const toggleArchive = (id: string) => setters.setArchivedBusinessIds((current: string[]) => toggleArchivedBusinessId(current, id));

  const requestArchiveStore = (business: AppBusiness) => setters.setDeleteTarget(
    buildArchiveStoreDeleteTarget(business, staffWithoutActiveStoreAfterArchive(business.id)),
  );

  const openStoreDelete = (business: AppBusiness) => {
    const hasRecords = storeHasRecords(business);
    setters.setDeleteTarget(buildRemoveStoreDeleteTarget(business, {
      hasRecords,
      affectedStaff: hasRecords ? staffWithoutActiveStoreAfterArchive(business.id) : [],
    }));
  };

  const resolveOrgConfigNotReadyMessage = () => (
    lang === "ar" ? "جارٍ تحميل بيانات المنشأة من السيرفر..." : "Loading organization data from server..."
  );

  const addStore = async () => {
    if (!canAddStore(entitlements)) {
      setters.setSettingsNotice(resolveStoreLimitMessage(entitlements, lang));
      return;
    }
    const name = newStoreName.trim();
    const location = newStoreLocation.trim();
    if (!name) return;

    if (isOrgConfigApiEnabled()) {
      if (!orgConfigApiContext?.enabled || !orgConfigApiContext.hydrated || orgConfigApiContext.loading) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        await createOrganizationStoreViaApi({
          organizationId: orgConfigApiContext.organizationId || "",
          actorUserId: orgConfigApiContext.actorUserId || "",
          actorRole: orgConfigApiContext.actorRole || "owner",
          name,
          location,
        });
        await orgConfigApiContext.reload?.();
        if (typeof reloadEntitlements === "function") {
          await reloadEntitlements();
        }
        setters.setNewStoreName("");
        setters.setNewStoreLocation("");
        setters.setShowAddStore(false);
        showSettingsSaved();
        return;
      } catch (failure) {
        setters.setSettingsNotice(
          failure instanceof Error ? failure.message : (lang === "ar" ? "تعذر إضافة المحل." : "Failed to add store."),
        );
      } finally {
        setters.setStoreSaving(false);
      }
      return;
    }

    const business = buildNewConfiguredBusiness({
      name: newStoreName,
      location: newStoreLocation,
      emptyStoreRecord,
    });
    if (!business) return;
    setters.setConfiguredBusinesses((current: AppBusiness[]) => [...current, business]);
    setters.setNewStoreName("");
    setters.setNewStoreLocation("");
    setters.setShowAddStore(false);
    showSettingsSaved();
  };

  const cancelManagingTeam = () => {
    setters.setDraftStaff(null);
    setters.setManagingTeam(false);
    setters.setNewEmployeeName("");
    setters.setNewEmployeeMobile("");
    setters.setNewEmployeeStoreIds([]);
  };

  const startManagingTeam = () => {
    setters.setDraftStaff(cloneStaffDraft(staff));
    setters.setManagingTeam(true);
  };

  const persistTeamDraft = async (
    teamDraft: StaffMember[],
    {
      persistRuntimeFallback = true,
      clearLocalPins = true,
      employeePinsOverride,
    }: {
      persistRuntimeFallback?: boolean;
      clearLocalPins?: boolean;
      employeePinsOverride?: Record<string, string>;
    } = {},
  ) => {
    const { staff: nextStaff, employeePins: nextPins } = prepareSavedTeamDraft(teamDraft, {
      draftAuthEmployeePins,
      authEmployeePins,
      defaultPin: defaultEmployeePin,
      pinsFromAuthIdentitiesOnly: isOrgConfigApiEnabled(),
    });
    const persistPins = employeePinsOverride ?? nextPins;

    if (isOrgConfigApiEnabled()) {
      if (
        !orgConfigApiContext?.enabled
        || typeof orgConfigApiContext.flushPersist !== "function"
        || !orgConfigApiContext.hydrated
        || orgConfigApiContext.loading
      ) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return false;
      }
      setters.setTeamSaving(true);
      setters.setSettingsNotice("");
      try {
        await orgConfigApiContext?.flushPersist?.({ staff: nextStaff }, { employeePins: persistPins });
        if (clearLocalPins) setters.setAuthEmployeePins({});
        cancelManagingTeam();
        if (typeof reloadEntitlements === "function") {
          await reloadEntitlements();
        }
        if (persistRuntimeFallback && APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
          await onPersistSettingsNow(buildOwnerSettingsTeamPersistPayload({
            staff: nextStaff,
            authOwnerUsername,
            authOwnerPassword,
            omitStaff: true,
            omitEmployeePins: true,
          }));
        }
        showSettingsSaved();
        return true;
      } catch (failure) {
        setters.setSettingsNotice(resolveTeamSaveFailureMessage(failure, lang));
        return false;
      } finally {
        setters.setTeamSaving(false);
      }
    }

    setters.setStaff(nextStaff);
    setters.setAuthEmployeePins(persistPins);
    cancelManagingTeam();
    if (persistRuntimeFallback && APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
      setters.setTeamSaving(true);
      setters.setSettingsNotice("");
      try {
        await onPersistSettingsNow(buildOwnerSettingsTeamPersistPayload({
          staff: nextStaff,
          authOwnerUsername,
          authOwnerPassword,
          authEmployeePins: persistPins,
          omitStaff: isOrgConfigApiEnabled(),
        }));
        showSettingsSaved();
      } catch (failure) {
        setters.setSettingsNotice(resolveTeamSaveFailureMessage(failure, lang));
        return false;
      } finally {
        setters.setTeamSaving(false);
      }
      return true;
    }
    showSettingsSaved();
    return true;
  };

  const saveManagingTeam = async () => {
    if (!draftStaff || teamSaving) return;
    await persistTeamDraft(draftStaff);
  };

  const addStaff = () => {
    if (!canAddEmployeeSeat(entitlements)) {
      setters.setSettingsNotice(resolveEmployeeLimitMessage(entitlements, lang));
      return;
    }
    if (!canAddStaffMember({ name: newEmployeeName, storeIds: newEmployeeStoreIds, managingTeam })) return;
    const created = buildNewStaffMember({
      name: newEmployeeName,
      mobile: newEmployeeMobile,
      storeIds: newEmployeeStoreIds,
      defaultPin: defaultEmployeePin,
    });
    setters.setDraftStaff((current: StaffMember[] | null) => [...(current || staff), created.member]);
    setters.setDraftAuthEmployeePins((current: Record<string, string>) => ({ ...(current || {}), ...created.employeePinsPatch }));
    setters.setNewEmployeeName("");
    setters.setNewEmployeeMobile("");
    setters.setNewEmployeeStoreIds([]);
  };

  const updateDraftEmployeePin = (personId: string, value: string) => {
    setters.setDraftAuthEmployeePins((current: Record<string, string>) => ({ ...(current || {}), [personId]: value }));
  };

  const updateEmployeeMobile = (personId: string, value: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: StaffMember[] | null) => updateEmployeeMobileInDraft(current || staff, personId, value));
  };

  const toggleEmployeeActive = (personId: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: StaffMember[] | null) => toggleEmployeeActiveInDraft(current || staff, personId));
  };

  const toggleEmployeeStore = (personId: string, storeId: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: StaffMember[] | null) => toggleEmployeeStoreInDraft(current || staff, personId, storeId));
  };

  const toggleNewEmployeeStore = (storeId: string) => {
    setters.setNewEmployeeStoreIds((current: string[]) => toggleStoreSelection(current, storeId));
  };

  const confirmDelete = async () => {
    if (deleteTarget?.type === "staff") {
      const personId = String(deleteTarget.item.id);
      const removePerson = (current: StaffMember[]) => current.map((person) => (
        person.id === personId ? { ...person, active: false, removed: true, deleted: true } : person
      ));
      const nextDraft = removePerson(managingTeam ? (draftStaff || staff) : staff);

      setters.setDraftAuthEmployeePins((current: Record<string, string>) => removeEmployeePinForPerson(current, personId));
      setters.setAuthEmployeePins((current: Record<string, string>) => removeEmployeePinForPerson(current, personId));
      setters.setDeleteTarget(null);
      setters.setDraftStaff(nextDraft);
      if (!managingTeam) setters.setManagingTeam(true);
      setters.setSettingsNotice(lang === "ar"
        ? "تم حذف الموظف من المسودة. اضغط حفظ صلاحيات الفريق لتثبيت التغيير."
        : "Employee removed from the draft. Save team permissions to apply the change.");
      return;
    }

    applyOwnerSettingsDeleteTarget({
      deleteTarget,
      selectedBusiness,
      apply: {
        appendArchivedBusinessId: (businessId: string) => {
          setters.setArchivedBusinessIds((current: string[]) => (current.includes(businessId) ? current : [...current, businessId]));
        },
        removeConfiguredBusiness: (businessId: string) => {
          setters.setConfiguredBusinesses((current: AppBusiness[]) => current.filter((business) => business.id !== businessId));
        },
        removeArchivedBusinessId: (businessId: string) => {
          setters.setArchivedBusinessIds((current: string[]) => current.filter((id: string) => id !== businessId));
        },
        removeStaffStoreId: (businessId: string) => {
          setters.setStaff((current: StaffMember[]) => current.map((person) => ({
            ...person,
            storeIds: (person.storeIds || []).filter((id: string) => id !== businessId),
          })));
        },
        removeLastCloseoutDate: (businessId: string) => {
          setters.setLastCloseoutDates((current: LastCloseoutDates) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        setSelectedBusiness: setters.setSelectedBusiness,
        clearArchivedReadOnlyBusinessId: () => setters.setArchivedReadOnlyBusinessId(null),
        removeStoreChannelSettings: (businessId: string) => {
          setters.setStoreChannelSettings((current: Record<string, StoreChannelConfig>) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        removeStoreOperationalSettings: (businessId: string) => {
          setters.setStoreOperationalSettings((current: StoreSettingsMap) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        closeStore,
        retireChannel: (channel: AppChannel | Record<string, unknown> | string) => {
          updateChannelDraft((config) => retireSalesChannelInDraft(config, toChannelTarget(channel)));
        },
        removeStaffMember: (personId: string) => {
          const removePerson = (current: StaffMember[]) => current.map((person) => (
            person.id === personId ? { ...person, active: false, removed: true, deleted: true } : person
          ));
          if (managingTeam) setters.setDraftStaff((current: StaffMember[] | null) => removePerson(current || staff));
          else setters.setStaff(removePerson);
        },
        removeEmployeePin: (personId: string) => {
          setters.setDraftAuthEmployeePins((current: Record<string, string>) => removeEmployeePinForPerson(current, personId));
          setters.setAuthEmployeePins((current: Record<string, string>) => removeEmployeePinForPerson(current, personId));
        },
      },
    });
    setters.setDeleteTarget(null);
  };

  return {
    saveOwnerProfile,
    saveAuthCredentials,
    openStore,
    closeStore,
    openStorePanel,
    backFromStorePanel,
    cancelChannelDraft,
    cancelOperationalDraft,
    saveStoreProfile,
    saveChannelSettings,
    saveOperationalSettings,
    updateOperationalDraft,
    toggleChannel,
    requestRetireChannel,
    restoreSalesChannel,
    deleteCustomIncomeSource,
    addCustomIncomeSource,
    toggleCategory,
    toggleArchive,
    requestArchiveStore,
    openStoreDelete,
    addStore,
    startManagingTeam,
    cancelManagingTeam,
    saveManagingTeam,
    addStaff,
    updateDraftEmployeePin,
    updateEmployeeMobile,
    toggleEmployeeActive,
    toggleEmployeeStore,
    toggleNewEmployeeStore,
    confirmDelete,
  };
}

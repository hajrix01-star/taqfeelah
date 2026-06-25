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
import { emptyStoreRecord, text } from "./taqfeelah-app-demo-data";
import { APP_IN_PRODUCTION_MODE, PROTOTYPE_EMPLOYEE_PIN_DEFAULT } from "./taqfeelah-app-boot";
import type { OwnerSettingsScreenHandlersContext } from "./taqfeelah-app-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerAny = any;

export function createOwnerSettingsScreenHandlers(ctx: OwnerSettingsScreenHandlersContext) {
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
  } = ctx;

  const resetStoreDrafts = () => {
    setters.setDraftStoreName("");
    setters.setDraftStoreLocation("");
    setters.setDraftStoreChannelConfig(null);
    setters.setDraftStoreOperationalConfig(null);
    setters.setNewCustomIncomeSourceName("");
    setters.setSettingsNotice("");
  };

  const closeStore = () => {
    resetStoreDrafts();
    setters.setSettingsStoreId(null);
    setters.setStorePanel("overview");
  };

  const updateChannelDraft = (updater: HandlerAny) => {
    setters.setDraftStoreChannelConfig((current: HandlerAny) => updater(current || savedChannelConfig));
  };

  const updateOperationalDraft = (updates: HandlerAny) => {
    setters.setDraftStoreOperationalConfig((current: HandlerAny) => mergeOperationalDraft(current || savedOperationalConfig, updates));
  };

  const staffWithoutActiveStoreAfterArchive = (businessId: string) => listStaffWithoutActiveStoreAfterArchive({
    staff: visibleStaff,
    businessId,
    activeBusinessIds: activeStoredBusinesses.map((business: HandlerAny) => business.id),
  });

  const storeHasRecords = (business: HandlerAny) => storeHasOperationalRecords(operationalEntries, business.id);

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

    if (isOrgConfigApiEnabled() && orgConfigApiContext?.enabled) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        await orgConfigApiContext.flushPersist({
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

    if (isOrgConfigApiEnabled() && orgConfigApiContext?.enabled) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      try {
        setters.setStoreSaving(true);
        setters.setSettingsNotice("");
        await orgConfigApiContext.flushPersist({
          storeChannelSettings: nextStoreChannelSettings,
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

    if (isOrgConfigApiEnabled() && orgConfigApiContext?.enabled) {
      if (!canFlushOrgConfig()) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        await orgConfigApiContext.flushPersist({
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

  const requestRetireChannel = (channel: HandlerAny) => {
    if (!canRequestRetireSalesChannel(channelConfig, channel)) {
      setters.setSettingsNotice(text(lang, "atLeastOneChannel"));
      return;
    }
    setters.setDeleteTarget({ type: "channel", item: channel });
  };

  const restoreSalesChannel = (channel: HandlerAny) => updateChannelDraft((config: HandlerAny) => restoreRetiredSalesChannel(config, channel));
  const deleteCustomIncomeSource = (channel: HandlerAny) => updateChannelDraft((config: HandlerAny) => deleteCustomSalesChannelInDraft(config, channel));

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

  const toggleArchive = (id: string) => setters.setArchivedBusinessIds((current: HandlerAny) => toggleArchivedBusinessId(current, id));

  const requestArchiveStore = (business: HandlerAny) => setters.setDeleteTarget(
    buildArchiveStoreDeleteTarget(business, staffWithoutActiveStoreAfterArchive(business.id)),
  );

  const openStoreDelete = (business: HandlerAny) => {
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

    if (isOrgConfigApiEnabled() && orgConfigApiContext?.enabled) {
      if (!orgConfigApiContext.hydrated || orgConfigApiContext.loading) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setStoreSaving(true);
      setters.setSettingsNotice("");
      try {
        await createOrganizationStoreViaApi({
          organizationId: orgConfigApiContext.organizationId,
          actorUserId: orgConfigApiContext.actorUserId,
          actorRole: orgConfigApiContext.actorRole || "owner",
          name,
          location,
        });
        await orgConfigApiContext.reload();
        if (typeof reloadEntitlements === "function") {
          await reloadEntitlements();
        }
        setters.setNewStoreName("");
        setters.setNewStoreLocation("");
        setters.setShowAddStore(false);
        showSettingsSaved();
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
    setters.setConfiguredBusinesses((current: HandlerAny) => [...current, business]);
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
    teamDraft: HandlerAny,
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
      defaultPin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT || "1234",
      pinsFromAuthIdentitiesOnly: isOrgConfigApiEnabled(),
    });
    const persistPins = employeePinsOverride ?? nextPins;

    if (isOrgConfigApiEnabled() && typeof orgConfigApiContext?.flushPersist === "function") {
      if (!orgConfigApiContext.hydrated || orgConfigApiContext.loading) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return false;
      }
      setters.setTeamSaving(true);
      setters.setSettingsNotice("");
      try {
        await orgConfigApiContext.flushPersist({ staff: nextStaff }, { employeePins: persistPins });
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
      } catch (failure) {
        setters.setSettingsNotice(resolveTeamSaveFailureMessage(failure, lang));
        return false;
      } finally {
        setters.setTeamSaving(false);
      }
      return true;
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
      defaultPin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
    });
    setters.setDraftStaff((current: HandlerAny) => [...(current || staff), created.member]);
    setters.setDraftAuthEmployeePins((current: HandlerAny) => ({ ...(current || {}), ...created.employeePinsPatch }));
    setters.setNewEmployeeName("");
    setters.setNewEmployeeMobile("");
    setters.setNewEmployeeStoreIds([]);
  };

  const updateDraftEmployeePin = (personId: string, value: string) => {
    setters.setDraftAuthEmployeePins((current: HandlerAny) => ({ ...(current || {}), [personId]: value }));
  };

  const updateEmployeeMobile = (personId: string, value: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: HandlerAny) => updateEmployeeMobileInDraft(current || staff, personId, value));
  };

  const toggleEmployeeActive = (personId: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: HandlerAny) => toggleEmployeeActiveInDraft(current || staff, personId));
  };

  const toggleEmployeeStore = (personId: string, storeId: string) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current: HandlerAny) => toggleEmployeeStoreInDraft(current || staff, personId, storeId));
  };

  const toggleNewEmployeeStore = (storeId: string) => {
    setters.setNewEmployeeStoreIds((current: HandlerAny) => toggleStoreSelection(current, storeId));
  };

  const confirmDelete = async () => {
    if (deleteTarget?.type === "staff") {
      const personId = String(deleteTarget.item.id);
      const removePerson = (current: HandlerAny) => current.map((person: HandlerAny) => (
        person.id === personId ? { ...person, active: false, removed: true, deleted: true } : person
      ));
      const nextDraft = removePerson(managingTeam ? (draftStaff || staff) : staff);

      setters.setDraftAuthEmployeePins((current: HandlerAny) => removeEmployeePinForPerson(current, personId));
      setters.setAuthEmployeePins((current: HandlerAny) => removeEmployeePinForPerson(current, personId));
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
          setters.setArchivedBusinessIds((current: HandlerAny) => (current.includes(businessId) ? current : [...current, businessId]));
        },
        removeConfiguredBusiness: (businessId: string) => {
          setters.setConfiguredBusinesses((current: HandlerAny) => current.filter((business: HandlerAny) => business.id !== businessId));
        },
        removeArchivedBusinessId: (businessId: string) => {
          setters.setArchivedBusinessIds((current: HandlerAny) => current.filter((id: string) => id !== businessId));
        },
        removeStaffStoreId: (businessId: string) => {
          setters.setStaff((current: HandlerAny) => current.map((person: HandlerAny) => ({
            ...person,
            storeIds: (person.storeIds || []).filter((id: string) => id !== businessId),
          })));
        },
        removeLastCloseoutDate: (businessId: string) => {
          setters.setLastCloseoutDates((current: HandlerAny) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        setSelectedBusiness: setters.setSelectedBusiness,
        clearArchivedReadOnlyBusinessId: () => setters.setArchivedReadOnlyBusinessId(null),
        removeStoreChannelSettings: (businessId: string) => {
          setters.setStoreChannelSettings((current: HandlerAny) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        removeStoreOperationalSettings: (businessId: string) => {
          setters.setStoreOperationalSettings((current: HandlerAny) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        closeStore,
        retireChannel: (channel: HandlerAny) => {
          updateChannelDraft((config: HandlerAny) => retireSalesChannelInDraft(config, channel));
        },
        removeStaffMember: (personId: string) => {
          const removePerson = (current: HandlerAny) => current.map((person: HandlerAny) => (
            person.id === personId ? { ...person, active: false, removed: true, deleted: true } : person
          ));
          if (managingTeam) setters.setDraftStaff((current: HandlerAny) => removePerson(current || staff));
          else setters.setStaff(removePerson);
        },
        removeEmployeePin: (personId: string) => {
          setters.setDraftAuthEmployeePins((current: HandlerAny) => removeEmployeePinForPerson(current, personId));
          setters.setAuthEmployeePins((current: HandlerAny) => removeEmployeePinForPerson(current, personId));
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

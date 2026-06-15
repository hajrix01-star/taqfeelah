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
import { emptyStoreRecord, text } from "./prototype-runtime-demo-data";
import { APP_IN_PRODUCTION_MODE, PROTOTYPE_EMPLOYEE_PIN_DEFAULT } from "./prototype-runtime-boot";

export function createOwnerSettingsScreenHandlers(ctx) {
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

  const updateChannelDraft = (updater) => {
    setters.setDraftStoreChannelConfig((current) => updater(current || savedChannelConfig));
  };

  const updateOperationalDraft = (updates) => {
    setters.setDraftStoreOperationalConfig((current) => mergeOperationalDraft(current || savedOperationalConfig, updates));
  };

  const staffWithoutActiveStoreAfterArchive = (businessId) => listStaffWithoutActiveStoreAfterArchive({
    staff: visibleStaff,
    businessId,
    activeBusinessIds: activeStoredBusinesses.map((business) => business.id),
  });

  const storeHasRecords = (business) => storeHasOperationalRecords(operationalEntries, business.id);

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

  const openStore = (id) => {
    resetStoreDrafts();
    setters.setSettingsStoreId(id);
    setters.setStorePanel("overview");
  };

  const openStorePanel = (panel) => {
    setters.setSettingsNotice("");
    setters.setStorePanel(panel);
    const drafts = resolveStorePanelOpenDrafts(panel, {
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

  const cancelChannelDraft = () => {
    setters.setDraftStoreChannelConfig(cloneStoreChannelDraft(savedChannelConfig));
    setters.setSettingsNotice("");
  };

  const cancelOperationalDraft = () => {
    setters.setDraftStoreOperationalConfig(cloneStoreOperationalDraft(savedOperationalConfig));
    setters.setSettingsNotice("");
  };

  const saveStoreProfile = () => {
    if (!settingsStoreId || !draftStoreName.trim()) return;
    setters.setConfiguredBusinesses((current) => applyStoreProfileUpdate(current, settingsStoreId, {
      name: draftStoreName,
      location: draftStoreLocation,
    }));
    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const saveChannelSettings = async () => {
    if (!settingsStoreId || !draftStoreChannelConfig) return;

    let nextStoreChannelSettings = null;
    setters.setStoreChannelSettings((current) => {
      nextStoreChannelSettings = applyPersistedStoreChannelSettings(
        current,
        settingsStoreId,
        draftStoreChannelConfig,
      );
      return nextStoreChannelSettings;
    });

    if (
      orgConfigApiContext?.enabled
      && orgConfigApiContext.hydrated
      && typeof orgConfigApiContext.flushPersist === "function"
    ) {
      try {
        setters.setSettingsNotice("");
        await orgConfigApiContext.flushPersist({
          storeChannelSettings: nextStoreChannelSettings,
        });
      } catch {
        setters.setSettingsNotice(
          lang === "ar"
            ? "تعذر حفظ قنوات الدخل على الخادم. أعد المحاولة."
            : "Could not save income channels on the server. Please retry.",
        );
        return;
      }
    }

    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const saveOperationalSettings = () => {
    if (!settingsStoreId || !draftStoreOperationalConfig) return;
    setters.setStoreOperationalSettings((current) => applyPersistedStoreOperationalSettings(current, settingsStoreId, draftStoreOperationalConfig));
    showSettingsSaved();
    leaveStorePanelAfterSave();
  };

  const toggleChannel = (id) => {
    const result = toggleIncomeSourceActive(channelConfig, id);
    if (result.blocked) {
      setters.setSettingsNotice(text(lang, "atLeastOneChannel"));
      return;
    }
    setters.setSettingsNotice("");
    updateChannelDraft(() => result.config);
  };

  const requestRetireChannel = (channel) => {
    if (!canRequestRetireSalesChannel(channelConfig, channel)) {
      setters.setSettingsNotice(text(lang, "atLeastOneChannel"));
      return;
    }
    setters.setDeleteTarget({ type: "channel", item: channel });
  };

  const restoreSalesChannel = (channel) => updateChannelDraft((config) => restoreRetiredSalesChannel(config, channel));

  const addCustomIncomeSource = () => {
    const result = addCustomSalesChannel(channelConfig, newCustomIncomeSourceName, {
      icon: CreditCard,
      kind: "payment_method",
    });
    if (!result.added) return;
    setters.setDraftStoreChannelConfig(result.config);
    setters.setNewCustomIncomeSourceName("");
  };

  const toggleCategory = (id) => {
    const result = toggleOperationalCategory(operationalConfig, id);
    if (result.blocked) {
      setters.setSettingsNotice(text(lang, "atLeastOneCategory"));
      return;
    }
    setters.setSettingsNotice("");
    setters.setDraftStoreOperationalConfig(result.config);
  };

  const toggleArchive = (id) => setters.setArchivedBusinessIds((current) => toggleArchivedBusinessId(current, id));

  const requestArchiveStore = (business) => setters.setDeleteTarget(
    buildArchiveStoreDeleteTarget(business, staffWithoutActiveStoreAfterArchive(business.id)),
  );

  const openStoreDelete = (business) => {
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
    setters.setConfiguredBusinesses((current) => [...current, business]);
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

  const saveManagingTeam = async () => {
    if (!draftStaff || teamSaving) return;
    const { staff: nextStaff, employeePins: nextPins } = prepareSavedTeamDraft(draftStaff, {
      draftAuthEmployeePins,
      authEmployeePins,
      defaultPin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT || "1234",
      pinsFromAuthIdentitiesOnly: isOrgConfigApiEnabled(),
    });

    if (isOrgConfigApiEnabled() && typeof orgConfigApiContext?.flushPersist === "function") {
      if (!orgConfigApiContext.hydrated || orgConfigApiContext.loading) {
        setters.setSettingsNotice(resolveOrgConfigNotReadyMessage());
        return;
      }
      setters.setTeamSaving(true);
      setters.setSettingsNotice("");
      try {
        await orgConfigApiContext.flushPersist({ staff: nextStaff }, { employeePins: nextPins });
        setters.setAuthEmployeePins({});
        cancelManagingTeam();
        if (typeof reloadEntitlements === "function") {
          await reloadEntitlements();
        }
        if (APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
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
      } finally {
        setters.setTeamSaving(false);
      }
      return;
    }

    setters.setStaff(nextStaff);
    setters.setAuthEmployeePins(nextPins);
    cancelManagingTeam();
    if (APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
      setters.setTeamSaving(true);
      setters.setSettingsNotice("");
      try {
        await onPersistSettingsNow(buildOwnerSettingsTeamPersistPayload({
          staff: nextStaff,
          authOwnerUsername,
          authOwnerPassword,
          authEmployeePins: nextPins,
          omitStaff: isOrgConfigApiEnabled(),
        }));
        showSettingsSaved();
      } catch (failure) {
        setters.setSettingsNotice(resolveTeamSaveFailureMessage(failure, lang));
      } finally {
        setters.setTeamSaving(false);
      }
      return;
    }
    showSettingsSaved();
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
    setters.setDraftStaff((current) => [...(current || staff), created.member]);
    setters.setDraftAuthEmployeePins((current) => ({ ...(current || {}), ...created.employeePinsPatch }));
    setters.setNewEmployeeName("");
    setters.setNewEmployeeMobile("");
    setters.setNewEmployeeStoreIds([]);
  };

  const updateDraftEmployeePin = (personId, value) => {
    setters.setDraftAuthEmployeePins((current) => ({ ...(current || {}), [personId]: value }));
  };

  const updateEmployeeMobile = (personId, value) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current) => updateEmployeeMobileInDraft(current || staff, personId, value));
  };

  const toggleEmployeeActive = (personId) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current) => toggleEmployeeActiveInDraft(current || staff, personId));
  };

  const toggleEmployeeStore = (personId, storeId) => {
    if (!managingTeam) return;
    setters.setDraftStaff((current) => toggleEmployeeStoreInDraft(current || staff, personId, storeId));
  };

  const toggleNewEmployeeStore = (storeId) => {
    setters.setNewEmployeeStoreIds((current) => toggleStoreSelection(current, storeId));
  };

  const confirmDelete = () => {
    applyOwnerSettingsDeleteTarget({
      deleteTarget,
      selectedBusiness,
      apply: {
        appendArchivedBusinessId: (businessId) => {
          setters.setArchivedBusinessIds((current) => (current.includes(businessId) ? current : [...current, businessId]));
        },
        removeConfiguredBusiness: (businessId) => {
          setters.setConfiguredBusinesses((current) => current.filter((business) => business.id !== businessId));
        },
        removeArchivedBusinessId: (businessId) => {
          setters.setArchivedBusinessIds((current) => current.filter((id) => id !== businessId));
        },
        removeStaffStoreId: (businessId) => {
          setters.setStaff((current) => current.map((person) => ({
            ...person,
            storeIds: (person.storeIds || []).filter((id) => id !== businessId),
          })));
        },
        removeLastCloseoutDate: (businessId) => {
          setters.setLastCloseoutDates((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        setSelectedBusiness: setters.setSelectedBusiness,
        clearArchivedReadOnlyBusinessId: () => setters.setArchivedReadOnlyBusinessId(null),
        removeStoreChannelSettings: (businessId) => {
          setters.setStoreChannelSettings((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        removeStoreOperationalSettings: (businessId) => {
          setters.setStoreOperationalSettings((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        closeStore,
        retireChannel: (channel) => {
          updateChannelDraft((config) => retireSalesChannelInDraft(config, channel));
        },
        removeStaffMember: (personId) => {
          const removePerson = (current) => current.map((person) => (
            person.id === personId ? { ...person, active: false, removed: true } : person
          ));
          if (managingTeam) setters.setDraftStaff((current) => removePerson(current || staff));
          else setters.setStaff(removePerson);
        },
        removeEmployeePin: (personId) => {
          setters.setDraftAuthEmployeePins((current) => removeEmployeePinForPerson(current, personId));
          setters.setAuthEmployeePins((current) => removeEmployeePinForPerson(current, personId));
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

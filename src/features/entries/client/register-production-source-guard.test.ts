import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("register production source guard", () => {
  it("serves /app through the Taqfeelah App entry instead of the demo page", () => {
    const appRoute = readProjectFile("src/app/app/page.tsx");
    const appClientGate = readProjectFile("src/features/taqfeelah-app/TaqfeelahAppClientGate.tsx");
    const appPage = readProjectFile("src/features/taqfeelah-app/TaqfeelahAppPage.tsx");
    const appRuntimeLoader = readProjectFile("src/lib/brand/load-taqfeelah-app-runtime.ts");

    expect(appRoute).toContain("@/features/taqfeelah-app/TaqfeelahAppPage");
    expect(appRoute).not.toContain("@/features/demo/AppRuntimePage");
    expect(() => readProjectFile("src/app/prototype-runtime/page.tsx")).toThrow();
    expect(() => readProjectFile("src/features/demo/AppRuntimePage.tsx")).toThrow();
    expect(appClientGate).not.toContain("migratePrototypeDemoDatasetIfNeeded");
    expect(appClientGate).not.toContain("prototype-demo-migrate");
    expect(appPage).toContain("@/lib/brand/use-taqfeelah-app-runtime");
    expect(appPage).not.toContain("use-taqfeelah-prototype-runtime");
    expect(appRuntimeLoader).toContain("@/features/taqfeelah-app/TaqfeelahAppRuntime");
    expect(() => readProjectFile("src/lib/brand/load-taqfeelah-prototype-runtime.ts")).toThrow();
    expect(() => readProjectFile("src/lib/brand/use-taqfeelah-prototype-runtime.ts")).toThrow();
  });

  it("does not seed or read local operational entries in server-authoritative modes", () => {
    const source = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-operational-entry-helpers.ts");

    expect(source).not.toContain("@/features/demo");
    expect(source).not.toContain("createPrototypeMonthDemoOperationalEntries");
    expect(source).toContain("return [];");
  });

  it("does not read or write demo last-closeout storage in server-authoritative settings modes", () => {
    const storage = readProjectFile("src/features/org-config/client/owner-settings-storage.ts");
    const settingsState = readProjectFile("src/features/org-config/client/use-owner-settings-state.ts");

    expect(storage).toContain("if (skipLocalDefaults) return {};");
    expect(settingsState).toContain("const skipLocalBootstrap = bindsToServerAuth || orgConfigApiEnabled || closeoutsApiDbSource;");
    expect(settingsState).toContain("skipLocalBootstrap");
    expect(settingsState).not.toContain("if (\n      bindsToServerAuth\n      || typeof window");
  });

  it("does not read or write notebook theme local storage in server-authoritative settings modes", () => {
    const settingsState = readProjectFile("src/features/org-config/client/use-owner-settings-state.ts");
    const themeReadIndex = settingsState.indexOf("safeGetLocalStorageItem(\"taqfeelah_notebook_theme\"");
    const themeWriteIndex = settingsState.indexOf("safeSetLocalStorageItem(\"taqfeelah_notebook_theme\", notebookTheme");
    const skipReadIndex = settingsState.indexOf("function readLocalLocalNotebookTheme(skipLocalBootstrap: boolean)");
    const skipWriteIndex = settingsState.indexOf("function writeLocalLocalNotebookTheme(notebookTheme: string, skipLocalBootstrap: boolean)");

    expect(skipReadIndex).toBeGreaterThan(-1);
    expect(themeReadIndex).toBeGreaterThan(skipReadIndex);
    expect(skipWriteIndex).toBeGreaterThan(-1);
    expect(themeWriteIndex).toBeGreaterThan(skipWriteIndex);
    expect(settingsState).not.toContain("window.localStorage.getItem(\"taqfeelah_notebook_theme\")");
    expect(settingsState).not.toContain("window.localStorage.setItem(\"taqfeelah_notebook_theme\", notebookTheme)");
  });

  it("does not keep stale register entry pages as financial placeholder data", () => {
    const source = readProjectFile("src/features/entries/client/use-register-entries-from-api.ts");

    expect(source).not.toContain("keepPreviousData");
    expect(source).not.toContain("placeholderData");
  });

  it("does not keep stale report totals as financial placeholder data", () => {
    const source = readProjectFile("src/features/reports/client/use-store-reports.ts");

    expect(source).not.toContain("keepPreviousData");
    expect(source).not.toContain("placeholderData");
  });

  it("removes the legacy home summary hook so reports remain the single financial read model", () => {
    const source = readProjectFile("src/features/reports/client/use-store-reports.ts");

    expect(source).not.toContain("keepPreviousData");
    expect(source).not.toContain("placeholderData");
    expect(() => readProjectFile("src/features/reports/client/use-store-day-summaries.ts")).toThrow();
  });

  it("uses the reports read model for the owner home financial summary", () => {
    const source = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-home-screen.tsx");

    expect(source).toContain("@/features/reports/client/use-store-reports");
    expect(source).not.toContain("@/features/reports/client/use-store-day-summaries");
    expect(source).toContain("includeDetails: false");
    expect(source).toContain("entriesDbSource: strictServerFinancialSource");
  });

  it("keeps target heatmap sales figures server-only", () => {
    const source = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-target-heatmap-screen.tsx");

    expect(source).toContain("@/features/reports/client/use-store-reports");
    expect(source).toContain("@/features/org-config/client/org-config-api-client");
    expect(source).toContain("updateStoreOperationalSettingsViaApi");
    expect(source).not.toContain("targetServerOnly");
    expect(source).toContain("includeDetails: true");
    expect(source).not.toContain("operationalEntries");
    expect(source).not.toContain("summaryDayFromEntries");
  });

  it("keeps register server reads behind a single read-model adapter", () => {
    const screen = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-register-screen.tsx");
    const adapter = readProjectFile("src/features/entries/client/use-register-server-read-model.ts");

    expect(screen).toContain("@/features/entries/client/use-register-server-read-model");
    expect(screen).not.toContain("@/features/entries/client/use-register-entries-from-api");
    expect(screen).not.toContain("@/features/reports/client/use-store-reports");
    expect(adapter).toContain("useRegisterEntriesFromApi");
    expect(adapter).toContain("useStoreReports");
    expect(adapter).toContain("useRegisterOverviewFromApi");
    expect(adapter).toContain("useRegisterCloseoutsFromApi");
    expect(adapter).toContain("buildRegisterServerReadModel");
    expect(adapter).toContain("shouldEnableRegisterReportRead");
  });

  it("uses the server closeouts read model for register closeouts in API mode", () => {
    const screen = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-register-screen.tsx");
    const adapter = readProjectFile("src/features/entries/client/use-register-server-read-model.ts");
    const closeoutHook = readProjectFile("src/features/entries/client/use-register-closeouts-from-api.ts");
    const overviewHook = readProjectFile("src/features/entries/client/use-register-overview-from-api.ts");

    expect(adapter).toContain("closeoutsEnabled");
    expect(adapter).toContain("overviewEnabled");
    expect(adapter).toContain("closeouts: overview.closeouts");
    expect(overviewHook).toContain("fetchRegisterOverviewViaApi");
    expect(overviewHook).toContain("operationalQueryKeys.registerOverview");
    expect(closeoutHook).toContain("fetchStoreCloseoutsViaApi");
    expect(closeoutHook).not.toContain("useRegisterEntriesFromApi");
    expect(screen).toContain("buildRegisterCloseoutSummariesFromRecords");
    expect(screen).toContain("closeoutsReadModelEnabled ? apiCloseoutSummaries : entryDerivedCloseoutSummaries");
  });

  it("does not keep stale home attachment rows as placeholder data in API mode", () => {
    const source = readProjectFile("src/features/entries/client/use-home-day-attachments.ts");

    expect(source).not.toContain("keepPreviousData");
    expect(source).not.toContain("placeholderData");
    expect(source).toContain("strictServerSource");
    expect(source).toContain("resolveHomeDayAttachmentGroupFromServer");
    expect(source).toContain("resolveHomeDayAttachmentGroupFromLocal");
    expect(source).not.toContain("resolveHomeDayAttachmentGroup({");
  });

  it("does not persist operational entries to browser storage", () => {
    const source = readProjectFile("src/features/operations/client/use-taqfeelah-app-operational-entries.ts");
    const boot = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-boot.ts");
    const operationalEntryHelpers = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-operational-entry-helpers.ts");

    expect(source).not.toContain("safeSetLocalStorageItem");
    expect(source).not.toContain("operational-fallback");
    expect(source).not.toContain("OPERATIONAL_ENTRIES_STORAGE_KEY");
    expect(boot).not.toContain("OPERATIONAL_ENTRIES_STORAGE_KEY");
    expect(operationalEntryHelpers).not.toContain("readLocalStorageJson");
  });

  it("does not expose duplicate subscription or invite-create UI roots in owner settings", () => {
    const tabPrimitives = readProjectFile("src/components/taqfeelah-app/owner-settings-tab-primitives.tsx");
    const tabNavigation = readProjectFile("src/components/taqfeelah-app/owner-settings-tab-navigation.ts");
    const teamSection = readProjectFile("src/components/taqfeelah-app/owner-settings-team-section.tsx");

    expect(tabPrimitives).not.toContain("id: \"subscription\"");
    expect(tabNavigation).toContain("if (normalized === \"subscription\") return \"help\";");
    expect(teamSection).toContain("OwnerSettingsTeamRoster");
    expect(teamSection).not.toContain("OwnerSettingsTeamSectionWithInvites");
    expect(() => readProjectFile("src/components/taqfeelah-app/owner-settings-team-section-with-invites.tsx")).toThrow();
    expect(() => readProjectFile("src/components/taqfeelah-app/owner-settings-team-invite-create.tsx")).toThrow();
    expect(() => readProjectFile("src/components/taqfeelah-app/owner-settings-team-pending-invites.tsx")).toThrow();
  });

  it("blocks notebook export local fallback when server export data is required", () => {
    const source = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-notebook-share-modal.tsx");

    expect(source).toContain("apiDataRequired");
    expect(source).toContain("No local fallback data is used");
    expect(source).toContain("if (apiDataRequired && (shouldWaitForApi || apiDataUnavailable)) return null;");
  });

  it("does not export register operations from partial screen rows in server source mode", () => {
    const screen = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-register-screen.tsx");
    const exportModel = readProjectFile("src/features/exports/client/build-data-export-model.ts");
    const serverExport = readProjectFile("src/features/exports/server/get-notebook-export.ts");

    expect(screen).toContain("requiresServerExport: strictRegisterSource");
    expect(screen).toContain("logView === \"operations\" || logView === \"attachments\" || (logView === \"report\" && showAllStores)");
    expect(screen).toContain("periodEntries: strictRegisterSource ? [] : periodEntries");
    expect(exportModel).toContain("requiresServerExport");
    expect(exportModel).toContain("does not use partial screen data");
    expect(serverExport).not.toContain(".limit(500)");
  });

  it("does not describe a local financial fallback in the register report error path", () => {
    const source = readProjectFile("src/components/taqfeelah-app/taqfeelah-app-owner-register-screen.tsx");

    expect(source).not.toContain("Showing available local data");
    expect(source).not.toContain("تم عرض البيانات المحلية المتاحة");
    expect(source).toContain("No local fallback data is shown");
  });
  it("does not fall back to local owner notebook notes in API mode", () => {
    const source = readProjectFile("src/features/owner-notebook/client/use-owner-notebook-notes.ts");
    const apiBranch = source.slice(source.indexOf("if (apiEnabled)"), source.indexOf("setNotes(mergeLegacyOwnerNotebookNotesIntoLocalStore"));

    expect(apiBranch).toContain("setLoadError(\"owner-notebook-api-load-failed\")");
    expect(apiBranch).toContain("setNotes([])");
    expect(apiBranch).not.toContain("mergeLegacyOwnerNotebookNotesIntoLocalStore");
  });

  it("saves store settings through confirmed org-config persistence in API mode", () => {
    const handlers = readProjectFile("src/components/taqfeelah-app/owner-settings-screen-action-handlers.ts");
    const state = readProjectFile("src/components/taqfeelah-app/use-owner-settings-screen-state.ts");

    expect(state).toContain("configuredBusinesses");
    expect(state).toContain("storeChannelSettings");
    expect(state).toContain("storeOperationalSettings");
    expect(handlers).toContain("canFlushOrgConfig");
    expect(handlers).toContain("configuredBusinesses: nextConfiguredBusinesses");
    expect(handlers).toContain("storeChannelSettings: nextStoreChannelSettings");
    expect(handlers).toContain("storeOperationalSettings: nextStoreOperationalSettings");
  });

  it("uses explicit unknown labels instead of generic channel fallbacks", () => {
    const entriesApi = readProjectFile("src/features/entries/client/store-entries-api-client.ts");
    const closeoutsApi = readProjectFile("src/features/closeouts/client/closeouts-api-client.ts");
    const closeoutSales = readProjectFile("src/features/closeouts/client/resolve-closeout-sales-channels.ts");

    expect(entriesApi).not.toContain(": \"Channel\"");
    expect(closeoutsApi).not.toContain(": \"Channel\"");
    expect(closeoutSales).not.toContain("return \"Channel\"");
    expect(entriesApi).toContain("Unknown channel");
    expect(closeoutsApi).toContain("Unknown channel");
    expect(closeoutSales).toContain("Unknown channel");
  });
});

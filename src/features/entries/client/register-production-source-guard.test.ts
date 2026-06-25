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
    const prototypeRoute = readProjectFile("src/app/prototype-runtime/page.tsx");
    const appClientGate = readProjectFile("src/features/taqfeelah-app/TaqfeelahAppClientGate.tsx");
    const appPage = readProjectFile("src/features/taqfeelah-app/TaqfeelahAppPage.tsx");
    const appRuntimeLoader = readProjectFile("src/lib/brand/load-taqfeelah-app-runtime.ts");

    expect(appRoute).toContain("@/features/taqfeelah-app/TaqfeelahAppPage");
    expect(appRoute).not.toContain("@/features/demo/AppRuntimePage");
    expect(prototypeRoute).toContain("@/features/demo/AppRuntimePage");
    expect(appClientGate).not.toContain("migratePrototypeDemoDatasetIfNeeded");
    expect(appClientGate).not.toContain("prototype-demo-migrate");
    expect(appPage).toContain("@/lib/brand/use-taqfeelah-app-runtime");
    expect(appPage).not.toContain("use-taqfeelah-prototype-runtime");
    expect(appRuntimeLoader).toContain("@/features/taqfeelah-app/TaqfeelahAppRuntime");
    expect(() => readProjectFile("src/lib/brand/load-taqfeelah-prototype-runtime.ts")).toThrow();
    expect(() => readProjectFile("src/lib/brand/use-taqfeelah-prototype-runtime.ts")).toThrow();
  });

  it("does not seed or read local operational entries in server-authoritative modes", () => {
    const source = readProjectFile("src/components/prototype-runtime/prototype-runtime-demo-operational-entries.ts");

    expect(source).toContain("if (typeof window === \"undefined\") return BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE ? [] : createDemoOperationalEntries();");
    expect(source).toContain("if (BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE) return [];");
  });

  it("does not read or write demo last-closeout storage in server-authoritative settings modes", () => {
    const storage = readProjectFile("src/features/org-config/client/owner-settings-storage.ts");
    const settingsState = readProjectFile("src/features/org-config/client/use-owner-settings-state.ts");

    expect(storage).toContain("if (skipDemoDefaults) return {};");
    expect(settingsState).toContain("const skipDemoBootstrap = bindsToServerAuth || orgConfigApiEnabled || closeoutsApiDbSource;");
    expect(settingsState).toContain("skipDemoBootstrap");
    expect(settingsState).not.toContain("if (\n      bindsToServerAuth\n      || typeof window");
  });

  it("does not read or write notebook theme local storage in server-authoritative settings modes", () => {
    const settingsState = readProjectFile("src/features/org-config/client/use-owner-settings-state.ts");
    const themeReadIndex = settingsState.indexOf("window.localStorage.getItem(\"taqfeelah_notebook_theme\")");
    const themeWriteIndex = settingsState.indexOf("window.localStorage.setItem(\"taqfeelah_notebook_theme\", notebookTheme)");
    const skipReadIndex = settingsState.indexOf("if (skipDemoBootstrap) return \"yellow\";");
    const skipWriteIndex = settingsState.indexOf("skipDemoBootstrap\n      || typeof window");

    expect(skipReadIndex).toBeGreaterThan(-1);
    expect(themeReadIndex).toBeGreaterThan(skipReadIndex);
    expect(skipWriteIndex).toBeGreaterThan(-1);
    expect(themeWriteIndex).toBeGreaterThan(skipWriteIndex);
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
    const source = readProjectFile("src/components/prototype-runtime/prototype-runtime-owner-home-screen.tsx");

    expect(source).toContain("@/features/reports/client/use-store-reports");
    expect(source).not.toContain("@/features/reports/client/use-store-day-summaries");
    expect(source).toContain("includeDetails: false");
    expect(source).toContain("entriesDbSource: strictServerFinancialSource");
  });

  it("keeps register server reads behind a single read-model adapter", () => {
    const screen = readProjectFile("src/components/prototype-runtime/prototype-runtime-owner-register-screen.tsx");
    const adapter = readProjectFile("src/features/entries/client/use-register-server-read-model.ts");

    expect(screen).toContain("@/features/entries/client/use-register-server-read-model");
    expect(screen).not.toContain("@/features/entries/client/use-register-entries-from-api");
    expect(screen).not.toContain("@/features/reports/client/use-store-reports");
    expect(adapter).toContain("useRegisterEntriesFromApi");
    expect(adapter).toContain("useStoreReports");
    expect(adapter).toContain("buildRegisterServerReadModel");
    expect(adapter).toContain("shouldEnableRegisterReportRead");
  });

  it("does not keep stale home attachment rows as placeholder data in API mode", () => {
    const source = readProjectFile("src/features/entries/client/use-home-day-attachments.ts");

    expect(source).not.toContain("keepPreviousData");
    expect(source).not.toContain("placeholderData");
    expect(source).toContain("strictServerSource");
  });

  it("does not persist operational entries to browser storage", () => {
    const source = readProjectFile("src/features/operations/client/use-prototype-runtime-operational-entries.ts");
    const boot = readProjectFile("src/components/prototype-runtime/prototype-runtime-boot.ts");
    const demoEntries = readProjectFile("src/components/prototype-runtime/prototype-runtime-demo-operational-entries.ts");

    expect(source).not.toContain("safeSetLocalStorageItem");
    expect(source).not.toContain("operational-fallback");
    expect(source).not.toContain("OPERATIONAL_ENTRIES_STORAGE_KEY");
    expect(boot).not.toContain("OPERATIONAL_ENTRIES_STORAGE_KEY");
    expect(demoEntries).not.toContain("readLocalStorageJson");
  });

  it("does not expose duplicate subscription or invite-create UI roots in owner settings", () => {
    const tabPrimitives = readProjectFile("src/components/prototype-runtime/owner-settings-tab-primitives.tsx");
    const tabNavigation = readProjectFile("src/components/prototype-runtime/owner-settings-tab-navigation.ts");
    const teamSection = readProjectFile("src/components/prototype-runtime/owner-settings-team-section.tsx");

    expect(tabPrimitives).not.toContain("id: \"subscription\"");
    expect(tabNavigation).toContain("if (normalized === \"subscription\") return \"help\";");
    expect(teamSection).toContain("OwnerSettingsTeamRoster");
    expect(teamSection).not.toContain("OwnerSettingsTeamSectionWithInvites");
    expect(() => readProjectFile("src/components/prototype-runtime/owner-settings-team-section-with-invites.tsx")).toThrow();
    expect(() => readProjectFile("src/components/prototype-runtime/owner-settings-team-invite-create.tsx")).toThrow();
    expect(() => readProjectFile("src/components/prototype-runtime/owner-settings-team-pending-invites.tsx")).toThrow();
  });

  it("blocks notebook export local fallback when server export data is required", () => {
    const source = readProjectFile("src/components/prototype-runtime/prototype-runtime-notebook-share-modal.tsx");

    expect(source).toContain("apiDataRequired");
    expect(source).toContain("No local fallback data is used");
    expect(source).toContain("if (apiDataRequired && (shouldWaitForApi || apiDataUnavailable)) return null;");
  });

  it("does not describe a local financial fallback in the register report error path", () => {
    const source = readProjectFile("src/components/prototype-runtime/prototype-runtime-owner-register-screen.tsx");

    expect(source).not.toContain("Showing available local data");
    expect(source).not.toContain("تم عرض البيانات المحلية المتاحة");
    expect(source).toContain("No local fallback data is shown");
  });
});

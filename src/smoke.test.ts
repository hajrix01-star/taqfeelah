import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Module-boundary smoke: catches missing imports/exports after runtime splits
 * without booting the browser (Playwright covers full runtime separately).
 */
const SMOKE_IMPORT_TIMEOUT_MS = 15_000;

describe("taqfeelah app module boundary smoke", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads taqfeelah-app boot exports", async () => {
    const boot = await import("@/components/taqfeelah-app/taqfeelah-app-boot");
    expect(boot.BINDS_TO_SERVER_AUTH).toBeTypeOf("boolean");
    expect(boot.ENTRIES_API_DB_SOURCE).toBeTypeOf("boolean");
    expect(boot.CLOSEOUTS_API_DB_SOURCE).toBeTypeOf("boolean");
    expect(boot.readSavedSettings).toBeTypeOf("function");
    expect(boot.DEFAULT_STAFF).toEqual([]);
  });

  it("loads taqfeelah-app chrome shell exports", async () => {
    const chrome = await import("@/components/taqfeelah-app/taqfeelah-app-chrome");
    expect(chrome.TopBar).toBeTypeOf("function");
    expect(chrome.BottomNav).toBeTypeOf("function");
    expect(chrome.Logo).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner settings section exports", async () => {
    const settings = await import("@/components/taqfeelah-app/OwnerSettingsSection");
    expect(settings.OwnerSettingsScreen).toBeTypeOf("function");
    expect(settings.SettingToggle).toBeTypeOf("function");
    expect(settings.ActionRow).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads split owner settings view modules", async () => {
    const [account, appearance, home, stores, subscription, support, team, views] = await Promise.all([
      import("@/components/taqfeelah-app/owner-settings-account-section"),
      import("@/components/taqfeelah-app/owner-settings-appearance-section"),
      import("@/components/taqfeelah-app/owner-settings-home-section"),
      import("@/components/taqfeelah-app/owner-settings-stores-section"),
      import("@/components/taqfeelah-app/owner-settings-subscription-section"),
      import("@/components/taqfeelah-app/owner-settings-support-section"),
      import("@/components/taqfeelah-app/owner-settings-team-section"),
      import("@/components/taqfeelah-app/owner-settings-section-views"),
    ]);

    expect(account.OwnerSettingsAccountSection).toBeTypeOf("function");
    expect(appearance.OwnerSettingsAppearanceSection).toBeTypeOf("function");
    expect(home.OwnerSettingsHomeSection).toBeTypeOf("function");
    expect(stores.OwnerSettingsStoresSection).toBeTypeOf("function");
    expect(subscription.OwnerSettingsSubscriptionSection).toBeTypeOf("function");
    expect(support.OwnerSettingsSupportSection).toBeTypeOf("function");
    expect(team.OwnerSettingsTeamSection).toBeTypeOf("function");
    expect(views.OwnerSettingsStoresTeamSection).toBeTypeOf("function");
    expect(views.renderOwnerSettingsSection).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner summary details exports", async () => {
    const details = await import("@/components/taqfeelah-app/owner-summary-details");
    expect(details.SummaryReportDetails).toBeTypeOf("function");
    expect(details.RatioBadge).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads taqfeelah-app entry helper exports", async () => {
    const helpers = await import("@/components/taqfeelah-app/taqfeelah-app-entry-helpers");
    expect(helpers.entryHasAttachment).toBeTypeOf("function");
    expect(helpers.expandRegisterCloseoutOperationRows).toBeTypeOf("function");
    expect(helpers.entryIsActive).toBeTypeOf("function");
  });

  it("loads closeout display helpers used by the register", async () => {
    const display = await import("@/features/entries/client/register-operation-display");
    const labels = await import("@/features/closeouts/client/closeout-day-label");
    const boot = await import("@/components/taqfeelah-app/taqfeelah-app-boot");
    const context = display.buildRegisterCloseoutDayContext([], {
      trustServerDaySequenceOnly: boot.ENTRIES_API_DB_SOURCE,
    });
    expect(context.daySequenceByCloseoutId).toBeInstanceOf(Map);
    expect(labels.closeoutSequenceLetter(1)).toBe("A");
    expect(labels.formatCloseoutDayLabel({
      formattedDate: "8 يونيو",
      daySequence: 2,
      sameDayCloseoutCount: 2,
    })).toBe("8 يونيو · B");
  });

  it("loads owner register screen exports", async () => {
    const register = await import("@/components/taqfeelah-app/taqfeelah-app-owner-register-screen");
    const connected = await import("@/components/taqfeelah-app/taqfeelah-app-owner-register-connected");
    expect(register.OwnerRegisterScreen).toBeTypeOf("function");
    expect(connected.OwnerRegisterConnected).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner entry screen exports", async () => {
    const screens = await import("@/components/taqfeelah-app/taqfeelah-app-owner-entry-screens");
    const utils = await import("@/components/taqfeelah-app/taqfeelah-app-entry-form-utils");
    expect(screens.OwnerSummaryScreen).toBeTypeOf("function");
    expect(screens.OwnerExpenseScreen).toBeTypeOf("function");
    expect(utils.toAmount).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads employee settings screen exports", async () => {
    const employeeSettings = await import("@/components/taqfeelah-app/taqfeelah-app-employee-settings-screen");
    expect(employeeSettings.EmployeeSettingsScreen).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads operation dialog exports", async () => {
    const dialogs = await import("@/components/taqfeelah-app/taqfeelah-app-operation-dialogs");
    expect(dialogs.OperationModal).toBeTypeOf("function");
    expect(dialogs.QuickAddSheet).toBeTypeOf("function");
    expect(dialogs.VoidOperationDialog).toBeTypeOf("function");
    expect(dialogs.RestoreOperationDialog).toBeTypeOf("function");
    expect(dialogs.DuplicateSalesDialog).toBeTypeOf("function");
    expect(dialogs.SavedOutflowShareDialog).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads attachment payload storage and UI exports", async () => {
    const storage = await import("@/features/attachments/client/attachment-payload-storage");
    const ui = await import("@/components/taqfeelah-app/taqfeelah-app-attachment-ui");
    expect(storage.storeAttachmentPayload).toBeTypeOf("function");
    expect(storage.stripEmbeddedAttachmentImages).toBeTypeOf("function");
    expect(ui.useAttachmentCapture).toBeTypeOf("function");
    expect(ui.AttachmentCapture).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner home screen exports", async () => {
    const home = await import("@/components/taqfeelah-app/taqfeelah-app-owner-home-screen");
    const attachments = await import("@/components/taqfeelah-app/owner-home-day-attachments");
    expect(home.OwnerHomeConnected).toBeTypeOf("function");
    expect(attachments.OwnerHomeDayAttachments).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner register screen exports", async () => {
    const register = await import("@/components/taqfeelah-app/taqfeelah-app-owner-register-connected");
    expect(register.OwnerRegisterConnected).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner notebook screen exports", async () => {
    const notebook = await import("@/components/taqfeelah-app/taqfeelah-app-owner-notebook-screen");
    expect(notebook.OwnerNotebookScreen).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads notebook share modal exports", async () => {
    const share = await import("@/components/taqfeelah-app/taqfeelah-app-notebook-share-modal");
    expect(share.NotebookShareModal).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner closeout modals exports", async () => {
    const closeouts = await import("@/components/taqfeelah-app/taqfeelah-app-owner-closeout-modals");
    expect(closeouts.OwnerCloseoutModals).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads operational entry helpers", async () => {
    const helpers = await import("@/components/taqfeelah-app/taqfeelah-app-operational-entry-helpers");
    expect(helpers.readOperationalEntries).toBeTypeOf("function");
    expect(helpers.buildEntry).toBeTypeOf("function");
    expect(helpers.defaultOwnerActor.userId).toBe("owner");
  });

  it("loads taqfeelah app orchestration hooks", async () => {
    const entries = await import("@/features/operations/client/use-taqfeelah-app-operational-entries");
    const session = await import("@/features/auth/client/use-taqfeelah-app-session");
    const closeouts = await import("@/features/closeouts/client/use-taqfeelah-app-closeouts-api");
    const auth = await import("@/features/auth/client/taqfeelah-app-auth-handlers");
    expect(entries.useTaqfeelahAppOperationalEntries).toBeTypeOf("function");
    expect(session.useTaqfeelahAppSessionState).toBeTypeOf("function");
    expect(session.useTaqfeelahAppSessionSync).toBeTypeOf("function");
    expect(closeouts.useTaqfeelahAppCloseoutsApi).toBeTypeOf("function");
    expect(auth.createTaqfeelahAppAuthHandlers).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads runtime capability resolver", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    const { resolveRuntimeCapabilities } = await import("@/core/config/runtime-capabilities");
    const capabilities = resolveRuntimeCapabilities({
      NEXT_PUBLIC_APP_MODE: "production",
      NEXT_PUBLIC_ENTRIES_API_ENABLED: "false",
      NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "false",
    });
    expect(capabilities.bindsToServerAuth).toBe(true);
    expect(capabilities.entriesApiDbSource).toBe(false);
  });
});

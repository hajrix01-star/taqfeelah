import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Module-boundary smoke: catches missing imports/exports after runtime splits
 * without booting the browser (Playwright covers full runtime separately).
 */
const SMOKE_IMPORT_TIMEOUT_MS = 15_000;

describe("prototype runtime module boundary smoke", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads prototype-runtime boot exports", async () => {
    const boot = await import("@/components/prototype-runtime/prototype-runtime-boot");
    expect(boot.BINDS_TO_SERVER_AUTH).toBeTypeOf("boolean");
    expect(boot.ENTRIES_API_DB_SOURCE).toBeTypeOf("boolean");
    expect(boot.CLOSEOUTS_API_DB_SOURCE).toBeTypeOf("boolean");
    expect(boot.readSavedSettings).toBeTypeOf("function");
    expect(boot.PROTOTYPE_DEFAULT_STAFF.length).toBeGreaterThan(0);
  });

  it("loads prototype-runtime chrome shell exports", async () => {
    const chrome = await import("@/components/prototype-runtime/prototype-runtime-chrome");
    expect(chrome.TopBar).toBeTypeOf("function");
    expect(chrome.BottomNav).toBeTypeOf("function");
    expect(chrome.Logo).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner settings section exports", async () => {
    const settings = await import("@/components/prototype-runtime/OwnerSettingsSection");
    expect(settings.OwnerSettingsScreen).toBeTypeOf("function");
    expect(settings.SettingToggle).toBeTypeOf("function");
    expect(settings.ActionRow).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner summary details exports", async () => {
    const details = await import("@/components/prototype-runtime/owner-summary-details");
    expect(details.SummaryReportDetails).toBeTypeOf("function");
    expect(details.RatioBadge).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads prototype-runtime entry helper exports", async () => {
    const helpers = await import("@/components/prototype-runtime/prototype-runtime-entry-helpers");
    expect(helpers.entryHasAttachment).toBeTypeOf("function");
    expect(helpers.expandRegisterCloseoutOperationRows).toBeTypeOf("function");
    expect(helpers.entryIsActive).toBeTypeOf("function");
  });

  it("loads closeout display helpers used by the register", async () => {
    const display = await import("@/features/entries/client/register-operation-display");
    const labels = await import("@/features/closeouts/client/closeout-day-label");
    const boot = await import("@/components/prototype-runtime/prototype-runtime-boot");
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
    const register = await import("@/components/prototype-runtime/prototype-runtime-owner-register-screen");
    expect(register.OwnerRegisterScreen).toBeTypeOf("function");
    expect(register.OwnerRegisterConnected).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner entry screen exports", async () => {
    const screens = await import("@/components/prototype-runtime/prototype-runtime-owner-entry-screens");
    const utils = await import("@/components/prototype-runtime/prototype-runtime-entry-form-utils");
    expect(screens.OwnerSummaryScreen).toBeTypeOf("function");
    expect(screens.OwnerExpenseScreen).toBeTypeOf("function");
    expect(utils.toAmount).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads employee settings screen exports", async () => {
    const employeeSettings = await import("@/components/prototype-runtime/prototype-runtime-employee-settings-screen");
    expect(employeeSettings.EmployeeSettingsScreen).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads operation dialog exports", async () => {
    const dialogs = await import("@/components/prototype-runtime/prototype-runtime-operation-dialogs");
    expect(dialogs.OperationModal).toBeTypeOf("function");
    expect(dialogs.QuickAddSheet).toBeTypeOf("function");
    expect(dialogs.VoidOperationDialog).toBeTypeOf("function");
    expect(dialogs.RestoreOperationDialog).toBeTypeOf("function");
    expect(dialogs.DuplicateSalesDialog).toBeTypeOf("function");
    expect(dialogs.SavedOutflowShareDialog).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads prototype attachment storage and UI exports", async () => {
    const storage = await import("@/features/attachments/client/prototype-attachment-storage");
    const ui = await import("@/components/prototype-runtime/prototype-runtime-attachment-ui");
    expect(storage.storeAttachmentPayload).toBeTypeOf("function");
    expect(storage.stripEmbeddedAttachmentImages).toBeTypeOf("function");
    expect(ui.useAttachmentCapture).toBeTypeOf("function");
    expect(ui.AttachmentCapture).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner home screen exports", async () => {
    const home = await import("@/components/prototype-runtime/prototype-runtime-owner-home-screen");
    expect(home.OwnerHomeConnected).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner register screen exports", async () => {
    const register = await import("@/components/prototype-runtime/prototype-runtime-owner-register-screen");
    expect(register.OwnerRegisterConnected).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner notebook screen exports", async () => {
    const notebook = await import("@/components/prototype-runtime/prototype-runtime-owner-notebook-screen");
    expect(notebook.OwnerNotebookScreen).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads notebook share modal exports", async () => {
    const share = await import("@/components/prototype-runtime/prototype-runtime-notebook-share-modal");
    expect(share.NotebookShareModal).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads owner closeout modals exports", async () => {
    const closeouts = await import("@/components/prototype-runtime/prototype-runtime-owner-closeout-modals");
    expect(closeouts.OwnerCloseoutModals).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads demo operational entry helpers", async () => {
    const demo = await import("@/components/prototype-runtime/prototype-runtime-demo-operational-entries");
    expect(demo.readOperationalEntries).toBeTypeOf("function");
    expect(demo.buildEntry).toBeTypeOf("function");
    expect(demo.prototypeOwnerActor.userId).toBe("owner");
  });

  it("loads prototype runtime orchestration hooks", async () => {
    const entries = await import("@/features/operations/client/use-prototype-runtime-operational-entries");
    const session = await import("@/features/auth/client/use-prototype-runtime-session");
    const closeouts = await import("@/features/closeouts/client/use-prototype-runtime-closeouts-api");
    const auth = await import("@/features/auth/client/prototype-runtime-auth-handlers");
    expect(entries.usePrototypeRuntimeOperationalEntries).toBeTypeOf("function");
    expect(session.usePrototypeRuntimeSessionState).toBeTypeOf("function");
    expect(session.usePrototypeRuntimeSessionSync).toBeTypeOf("function");
    expect(closeouts.usePrototypeRuntimeCloseoutsApi).toBeTypeOf("function");
    expect(auth.createPrototypeRuntimeAuthHandlers).toBeTypeOf("function");
  }, SMOKE_IMPORT_TIMEOUT_MS);

  it("loads runtime capability resolver", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    const { resolveRuntimeCapabilities } = await import("@/core/config/runtime-capabilities");
    const capabilities = resolveRuntimeCapabilities({
      NEXT_PUBLIC_APP_MODE: "production",
      NEXT_PUBLIC_ENTRIES_API_ENABLED: "false",
      NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "false",
    });
    expect(capabilities.prototypeAccessMode).toBe(false);
    expect(capabilities.bindsToServerAuth).toBe(true);
    expect(capabilities.entriesApiDbSource).toBe(false);
  });
});

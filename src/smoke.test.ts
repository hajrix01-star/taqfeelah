import { describe, expect, it } from "vitest";

/**
 * Module-boundary smoke: catches missing imports/exports after runtime splits
 * without booting the browser (Playwright covers full runtime separately).
 */
const SMOKE_IMPORT_TIMEOUT_MS = 15_000;

describe("prototype runtime module boundary smoke", () => {
  it("loads prototype-runtime boot exports", async () => {
    const boot = await import("@/components/prototype-runtime/prototype-runtime-boot");
    expect(boot.PROTOTYPE_ACCESS_MODE).toBeTypeOf("boolean");
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

  it("loads owner reports section exports", async () => {
    const reports = await import("@/components/prototype-runtime/OwnerReportsSection");
    expect(reports.ReportsScreen).toBeTypeOf("function");
    expect(reports.RatioBadge).toBeTypeOf("function");
    expect(reports.OutflowAnalysis).toBeTypeOf("function");
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
    const context = display.buildRegisterCloseoutDayContext([]);
    expect(context.daySequenceByCloseoutId).toBeInstanceOf(Map);
    expect(labels.closeoutSequenceLetter(1)).toBe("A");
    expect(labels.formatCloseoutDayLabel({
      formattedDate: "8 يونيو",
      daySequence: 2,
      sameDayCloseoutCount: 2,
    })).toBe("8 يونيو · B");
  });

  it("loads owner entry screen exports", async () => {
    const screens = await import("@/components/prototype-runtime/prototype-runtime-owner-entry-screens");
    const utils = await import("@/components/prototype-runtime/prototype-runtime-entry-form-utils");
    expect(screens.OwnerSummaryScreen).toBeTypeOf("function");
    expect(screens.OwnerExpenseScreen).toBeTypeOf("function");
    expect(utils.toAmount).toBeTypeOf("function");
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

  it("loads runtime capability resolver", async () => {
    const { resolveRuntimeCapabilities } = await import("@/core/config/runtime-capabilities");
    const capabilities = resolveRuntimeCapabilities({
      NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE: "true",
      NEXT_PUBLIC_ENTRIES_API_ENABLED: "false",
      NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "false",
    });
    expect(capabilities.prototypeAccessMode).toBe(true);
    expect(capabilities.entriesApiDbSource).toBe(false);
  });
});

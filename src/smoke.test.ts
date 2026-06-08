import { describe, expect, it } from "vitest";

/**
 * Module-boundary smoke: catches missing imports/exports after runtime splits
 * without booting the browser (Playwright covers full runtime separately).
 */
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
  });

  it("loads owner settings section exports", async () => {
    const settings = await import("@/components/prototype-runtime/OwnerSettingsSection");
    expect(settings.OwnerSettingsScreen).toBeTypeOf("function");
    expect(settings.SettingToggle).toBeTypeOf("function");
    expect(settings.ActionRow).toBeTypeOf("function");
  });

  it("loads owner reports section exports", async () => {
    const reports = await import("@/components/prototype-runtime/OwnerReportsSection");
    expect(reports.ReportsScreen).toBeTypeOf("function");
    expect(reports.RatioBadge).toBeTypeOf("function");
    expect(reports.OutflowAnalysis).toBeTypeOf("function");
  });

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

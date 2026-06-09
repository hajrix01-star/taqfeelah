import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import {
  getEmployeePreferences,
  saveEmployeePreferences,
} from "./employee-preferences-service";

const getRuntimeSettingsByOrganizationId = vi.fn();
const assertOrganizationAccess = vi.fn();
const insertValues = vi.fn();
const insertReturning = vi.fn();

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettingsByOrganizationId: (...args: unknown[]) => getRuntimeSettingsByOrganizationId(...args),
}));

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess: (...args: unknown[]) => assertOrganizationAccess(...args),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    insert: () => ({
      values: insertValues.mockReturnValue({
        returning: insertReturning,
      }),
    }),
  }),
}));

const ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const EMPLOYEE_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

describe("employee preferences service", () => {
  beforeEach(() => {
    getRuntimeSettingsByOrganizationId.mockReset();
    assertOrganizationAccess.mockReset();
    insertValues.mockReset();
    insertReturning.mockReset();
    assertOrganizationAccess.mockResolvedValue({ memberId: "member-1", memberRole: "employee" });
    insertReturning.mockResolvedValue([{ id: "audit-1", createdAt: new Date("2026-06-09T10:00:00.000Z") }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads notebook theme for the signed-in employee", async () => {
    getRuntimeSettingsByOrganizationId.mockResolvedValueOnce({
      settings: {
        employeePreferences: {
          [EMPLOYEE_ID]: { notebookTheme: "ivory" },
        },
      },
    });

    const result = await getEmployeePreferences({
      organizationId: ORG_ID,
      actorUserId: EMPLOYEE_ID,
      actorRole: "employee",
    });

    expect(result).toEqual({ notebookTheme: "ivory" });
  });

  it("rejects owner role on self-service preferences", async () => {
    await expect(getEmployeePreferences({
      organizationId: ORG_ID,
      actorUserId: EMPLOYEE_ID,
      actorRole: "owner",
    })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("merges only the current employee preference slice", async () => {
    getRuntimeSettingsByOrganizationId.mockResolvedValueOnce({
      settings: {
        notebookTheme: "yellow",
        employeePreferences: {
          "other-user": { notebookTheme: "classic" },
        },
        authConfig: { ownerPassword: "secret" },
      },
    });

    const result = await saveEmployeePreferences({
      organizationId: ORG_ID,
      actorUserId: EMPLOYEE_ID,
      actorRole: "employee",
      preferences: { notebookTheme: "greenTint" },
    });

    expect(result).toEqual({ notebookTheme: "greenTint" });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      action: "runtime_settings_saved",
      reason: "employee_preferences_saved",
      metadata: expect.objectContaining({
        settings: expect.objectContaining({
          notebookTheme: "yellow",
          authConfig: { ownerPassword: "secret" },
          employeePreferences: {
            "other-user": { notebookTheme: "classic" },
            [EMPLOYEE_ID]: { notebookTheme: "greenTint" },
          },
        }),
      }),
    }));
  });

  it("rejects invalid notebook themes", async () => {
    await expect(saveEmployeePreferences({
      organizationId: ORG_ID,
      actorUserId: EMPLOYEE_ID,
      actorRole: "employee",
      preferences: { notebookTheme: "not-a-theme" },
    })).rejects.toBeInstanceOf(ValidationError);
  });
});

import { describe, expect, it, vi } from "vitest";
import { auditEvents } from "@/core/db/schema";

const selectResult = [{
  id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  operationalSettings: { closeoutReviewEnabled: false, reviewEnabled: false },
}];

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess: vi.fn(async () => ({ memberRole: "owner", memberId: "member-1" })),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    transaction: async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) =>
      callback(createTx()),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => selectResult,
        }),
      }),
    }),
  }),
}));

function createTx() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => selectResult,
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [{
            id: selectResult[0].id,
            operationalSettings: {
              closeoutReviewEnabled: true,
              reviewEnabled: false,
              activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
              employeeHistoryVisibility: "all",
              closeoutAlert: false,
              attachmentAlert: false,
              notebookTheme: null,
            },
            updatedAt: new Date("2026-06-06T12:00:00.000Z"),
          }],
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: async (values: unknown) => {
        if (table === auditEvents) {
          expect((values as { action: string }).action).toBe("store_operational_settings_updated");
        }
        return values;
      },
    }),
  };
}

describe("updateStoreOperationalSettings", () => {
  it("persists closeout review flag and writes audit trail", async () => {
    const { updateStoreOperationalSettings } = await import("./update-store-operational-settings");
    const result = await updateStoreOperationalSettings({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      patch: { closeoutReviewEnabled: true },
    });

    expect(result.operationalSettings.closeoutReviewEnabled).toBe(true);
    expect(result.storeId).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });
});

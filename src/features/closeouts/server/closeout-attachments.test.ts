import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachments, auditEvents, dailyCloseouts } from "@/core/db/schema";
import { INLINE_ATTACHMENT_MAX_BYTES } from "@/core/attachments/inline-attachment-limits";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

type InsertCall = { table: unknown; values: unknown };

const insertCalls: InsertCall[] = [];
let txExistingCloseout = false;

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/features/closeouts/server/resolve-closeout-day-sequence", () => ({
  resolveCloseoutDaySequence: vi.fn(async () => 1),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => [{
          id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
          name: "Cash",
        }],
      }),
    }),
    transaction: async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) =>
      callback(createTx({ existingCloseout: txExistingCloseout })),
  }),
}));

function createTx({ existingCloseout = false } = {}) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (existingCloseout ? [{ id: "daily-closeout-1" }] : []),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        insertCalls.push({ table, values });
        const rows = Array.isArray(values) ? values : [values];
        return {
          returning: async () =>
            rows.map((row, index) => ({
              id: table === dailyCloseouts
                ? "daily-closeout-1"
                : table === attachments
                  ? `attachment-${index + 1}`
                  : `entry-${insertCalls.length}-${index}`,
              type: (row as { type?: string }).type,
              amountHalalas: (row as { amountHalalas?: number }).amountHalalas,
            })),
        };
      },
    }),
  };
}

const baseInput = {
  organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  date: "2026-06-05",
  actorUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  actorRole: "employee" as const,
  closeoutId: "closeout-employee-1",
  salesChannels: [{
    salesChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
    channelName: "Cash",
    amountHalalas: 120000,
  }],
  outflows: [],
  attachments: [],
  mode: "submit" as const,
};

describe("closeout attachments", () => {
  beforeEach(() => {
    txExistingCloseout = false;
    insertCalls.length = 0;
  });

  it("persists closeout-level attachments on the summary entry", async () => {
    const { submitStoreCloseout } = await import("./submit-store-closeout");

    await submitStoreCloseout({
      ...baseInput,
      attachments: [tinyPng],
    });

    const attachmentInserts = insertCalls.filter((call) => call.table === attachments);
    expect(attachmentInserts).toHaveLength(1);
    const attachmentRow = Array.isArray(attachmentInserts[0]?.values)
      ? attachmentInserts[0]?.values[0]
      : attachmentInserts[0]?.values;
    expect(attachmentRow).toMatchObject({
      organizationId: baseInput.organizationId,
      storeId: baseInput.storeId,
      mimeType: "image/png",
    });
    expect(String((attachmentRow as { storageKey?: string }).storageKey || "")).toContain("inline:v1:");
    expect(String((attachmentRow as { entryId?: string }).entryId || "")).toContain("entry-");
  });

  it("still submits closeouts without attachments", async () => {
    const { submitStoreCloseout } = await import("./submit-store-closeout");

    const result = await submitStoreCloseout(baseInput);

    expect(result.summaryEntryId).toBeTruthy();
    expect(insertCalls.filter((call) => call.table === attachments)).toHaveLength(0);
    expect(insertCalls.some((call) => call.table === auditEvents)).toBe(true);
  });

  it("accepts mobile-sized attachment metadata up to the shared inline limit", async () => {
    const { parseCloseoutAttachmentDataUrl } = await import("./closeout-attachment-input");
    const largeBase64 = "A".repeat(Math.floor((INLINE_ATTACHMENT_MAX_BYTES * 4) / 3));
    const dataUrl = `data:image/jpeg;base64,${largeBase64}`;
    const parsed = parseCloseoutAttachmentDataUrl(dataUrl, 0);
    expect(parsed?.sizeBytes).toBe(INLINE_ATTACHMENT_MAX_BYTES);
  });
});

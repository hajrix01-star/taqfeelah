import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/features/exports/server/export-job-storage", () => ({
  EXPORT_JOB_MIME_XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  buildExportJobRelativePath: (organizationId: string, jobId: string) => `${organizationId}/${jobId}.xlsx`,
  readExportJobFile: vi.fn(async () => ({ content: Buffer.from("xlsx"), sizeBytes: 4 })),
  writeExportJobFile: vi.fn(async () => undefined),
}));

vi.mock("@/features/exports/server/get-notebook-export", () => ({
  getNotebookExport: vi.fn(async () => ({
    storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    period: "year",
    from: "2026-01-01",
    to: "2026-12-31",
    totals: { sales: 1000, expense: 200, net: 800, ratio: "20.0%", proofs: 1 },
    channels: [{ channelId: "cash", name: "Cash", amount: 1000 }],
    operations: [{ id: "entry-1", date: "2026-01-01", type: "summary", amount: 1000, note: "", hasAttachment: false, createdAt: "2026-01-01T00:00:00.000Z" }],
  })),
}));

const insertedJobs: Record<string, unknown>[] = [];
let estimatedRows = 19000;

function makeJob(values: Record<string, unknown>) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    ...values,
    filePath: null,
    fileName: null,
    mimeType: null,
    errorMessage: null,
    createdAt: new Date("2026-06-30T00:00:00.000Z"),
    updatedAt: new Date("2026-06-30T00:00:00.000Z"),
  };
}

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: (fields?: Record<string, unknown>) => ({
      from: () => ({
        where: () => {
          if (fields && "rowCount" in fields) return Promise.resolve([{ rowCount: estimatedRows }]);
          return {
            limit: async () => insertedJobs,
          };
        },
      }),
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          const job = makeJob(values);
          insertedJobs[0] = job;
          return [job];
        },
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            insertedJobs[0] = { ...insertedJobs[0], ...values };
            return [insertedJobs[0]];
          },
        }),
      }),
    }),
  }),
}));

const baseInput = {
  organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  actorRole: "owner" as const,
  period: "year" as const,
  from: "2026-01-01",
  to: "2026-12-31",
  format: "excel" as const,
};

describe("export jobs service", () => {
  beforeEach(() => {
    insertedJobs.length = 0;
    estimatedRows = 19000;
  });

  it("estimates large register exports as async", async () => {
    const { estimateRegisterExport } = await import("./export-jobs-service");
    const estimate = await estimateRegisterExport(baseInput);

    expect(estimate.estimatedRows).toBe(19000);
    expect(estimate.mode).toBe("async");
    expect(estimate.reason).toBe("large_export");
    expect(estimate.recommendedFormat).toBe("excel");
  }, 15000);

  it("creates a ready Excel job with a download file", async () => {
    const { createRegisterExportJob } = await import("./export-jobs-service");
    const job = await createRegisterExportJob(baseInput);

    expect(job.status).toBe("ready");
    expect(job.rowCount).toBe(19000);
    expect(job.filePath).toBe("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1/11111111-1111-4111-8111-111111111111.xlsx");
    expect(String(job.fileName)).toContain("taqfeelah-register-operations");
  });

  it("rejects exports above the async row limit", async () => {
    estimatedRows = 20001;
    const { createRegisterExportJob } = await import("./export-jobs-service");

    await expect(createRegisterExportJob(baseInput)).rejects.toThrow("Export cannot exceed 20000 operations");
  });
});

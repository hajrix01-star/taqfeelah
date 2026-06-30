import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import type { MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { entries, exportJobs } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertBoundedReportRange, monthToDateRange } from "@/features/reports/server/report-date-range";
import { mergeEntryScopeWithCloseoutLink } from "@/features/entries/server/closeout-linked-entry-filter";
import { getNotebookExport } from "@/features/exports/server/get-notebook-export";
import {
  buildExportJobRelativePath,
  readExportJobFile,
  writeExportJobFile,
} from "@/features/exports/server/export-job-storage";
import { buildRegisterOperationsExcelBuffer } from "@/features/exports/server/register-export-workbook";

const ALLOWED_TYPES = ["summary", "purchases", "expense", "withdrawal"] as const;
export const DIRECT_EXPORT_ROW_LIMIT = 2_000;
export const ASYNC_EXPORT_ROW_LIMIT = 20_000;

const requestSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  period: z.enum(["day", "month", "year", "custom"]).default("custom"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  format: z.enum(["excel", "csv"]).default("excel"),
});

const jobLookupSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  jobId: z.string().uuid(),
});

type ExportRequest = z.infer<typeof requestSchema>;
type JobLookup = z.infer<typeof jobLookupSchema>;

function resolveRange(input: ExportRequest) {
  if (input.period === "day" && input.date) {
    return assertBoundedReportRange(input.date, input.date);
  }
  if (input.period === "month" && input.month) {
    const range = monthToDateRange(input.month);
    return assertBoundedReportRange(range.from, range.to);
  }
  if (!input.from || !input.to) {
    throw new ValidationError("Export requires from/to, date, or month.");
  }
  return assertBoundedReportRange(input.from, input.to);
}

async function assertExportAccess(input: Pick<ExportRequest, "organizationId" | "storeId" | "actorUserId" | "actorRole">) {
  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
    scope: "read",
  });
}

export async function estimateRegisterExport(rawInput: ExportRequest) {
  const parsed = requestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid export estimate input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const range = resolveRange(input);
  await assertExportAccess(input);

  const db = getDb();
  const entryScope = mergeEntryScopeWithCloseoutLink(
    input.organizationId,
    input.storeId,
    and(
      eq(entries.organizationId, input.organizationId),
      eq(entries.storeId, input.storeId),
      gte(entries.date, range.from),
      lte(entries.date, range.to),
      eq(entries.status, "active"),
      inArray(entries.type, ALLOWED_TYPES),
    ),
  );

  const [row] = await db
    .select({ rowCount: sql<number>`count(*)::int` })
    .from(entries)
    .where(entryScope);
  const rowCount = Number(row?.rowCount || 0);
  const mode = rowCount > DIRECT_EXPORT_ROW_LIMIT ? "async" : "direct";
  return {
    type: "register_operations",
    format: input.format,
    from: range.from,
    to: range.to,
    estimatedRows: rowCount,
    mode,
    recommendedFormat: rowCount > DIRECT_EXPORT_ROW_LIMIT ? "excel" : input.format,
    reason: rowCount > ASYNC_EXPORT_ROW_LIMIT
      ? "too_large"
      : rowCount > DIRECT_EXPORT_ROW_LIMIT
        ? "large_export"
        : "small_export",
    maxRows: ASYNC_EXPORT_ROW_LIMIT,
  };
}

function fileNameFor(range: { from: string; to: string }, jobId: string) {
  return `taqfeelah-register-operations-${range.from}-${range.to}-${jobId.slice(0, 8)}.xlsx`;
}

export async function createRegisterExportJob(rawInput: ExportRequest) {
  const parsed = requestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid export job input.", parsed.error.flatten());
  }
  const input = parsed.data;
  if (input.format !== "excel") {
    throw new ValidationError("Large register exports currently support Excel only.");
  }
  const estimate = await estimateRegisterExport(input);
  if (estimate.estimatedRows > ASYNC_EXPORT_ROW_LIMIT) {
    throw new ValidationError(`Export cannot exceed ${ASYNC_EXPORT_ROW_LIMIT} operations. Narrow the date range and retry.`);
  }

  const db = getDb();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const [job] = await db
    .insert(exportJobs)
    .values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      createdByUserId: input.actorUserId,
      type: "register_operations",
      format: "excel",
      status: "processing",
      filters: {
        period: input.period,
        from: estimate.from,
        to: estimate.to,
      },
      rowCount: estimate.estimatedRows,
      expiresAt,
    })
    .returning();

  try {
    const payload = await getNotebookExport({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      from: estimate.from,
      to: estimate.to,
      period: input.period,
    });
    const { buffer, mimeType } = await buildRegisterOperationsExcelBuffer(payload);
    const relativePath = buildExportJobRelativePath(input.organizationId, job.id, "xlsx");
    const fileName = fileNameFor({ from: estimate.from, to: estimate.to }, job.id);
    await writeExportJobFile(relativePath, buffer);

    const [readyJob] = await db
      .update(exportJobs)
      .set({
        status: "ready",
        filePath: relativePath,
        fileName,
        mimeType,
        updatedAt: new Date(),
      })
      .where(eq(exportJobs.id, job.id))
      .returning();
    return readyJob;
  } catch (error) {
    await db
      .update(exportJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Export failed.",
        updatedAt: new Date(),
      })
      .where(eq(exportJobs.id, job.id));
    throw error;
  }
}

export async function getExportJob(rawInput: JobLookup) {
  const parsed = jobLookupSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid export job lookup.", parsed.error.flatten());
  }
  const input = parsed.data;
  const db = getDb();
  const [job] = await db
    .select()
    .from(exportJobs)
    .where(and(
      eq(exportJobs.id, input.jobId),
      eq(exportJobs.organizationId, input.organizationId),
    ))
    .limit(1);
  if (!job) throw new ValidationError("Export job not found.");
  await assertExportAccess({
    organizationId: job.organizationId,
    storeId: job.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
  });
  return job;
}

export async function readExportJobDownload(rawInput: JobLookup) {
  const job = await getExportJob(rawInput);
  if (job.status !== "ready" || !job.filePath) {
    throw new ValidationError("Export job is not ready for download.");
  }
  if (job.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("Export download link has expired.");
  }
  const file = await readExportJobFile(job.filePath);
  return {
    ...file,
    fileName: job.fileName || `${job.id}.xlsx`,
    mimeType: job.mimeType || "application/octet-stream",
  };
}

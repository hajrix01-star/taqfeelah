import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getExportJob } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }
    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const job = await getExportJob({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      jobId: params.jobId,
    });
    return ok({
      job: {
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        rowCount: job.rowCount,
        expiresAt: job.expiresAt,
        fileName: job.fileName,
        errorMessage: job.errorMessage,
        downloadUrl: job.status === "ready" ? `/api/v1/exports/jobs/${job.id}/download` : null,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

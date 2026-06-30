import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { createRegisterExportJob } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

type CreateRegisterExportJobInput = Parameters<typeof createRegisterExportJob>[0];

function serializeJob(job: Record<string, unknown>) {
  return {
    id: job.id,
    type: job.type,
    format: job.format,
    status: job.status,
    rowCount: job.rowCount,
    expiresAt: job.expiresAt,
    fileName: job.fileName,
    errorMessage: job.errorMessage,
    downloadUrl: job.status === "ready" ? `/api/v1/exports/jobs/${job.id}/download` : null,
  };
}

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const input = body as CreateRegisterExportJobInput;
  const job = await createRegisterExportJob({
    ...input,
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  });
  return { data: { job: serializeJob(job) }, init: { status: 201 } };
});

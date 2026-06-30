import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { getExportJob } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ jobId: string }>(async ({ auth, params }) => {
  const job = await getExportJob({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    jobId: params.jobId,
  });
  return {
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
  };
});

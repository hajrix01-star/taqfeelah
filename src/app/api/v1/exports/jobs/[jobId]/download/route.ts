import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { readExportJobDownload } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ jobId: string }>(async ({ auth, params }) => {
  const file = await readExportJobDownload({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    jobId: params.jobId,
  });
  return new Response(file.content, {
    headers: {
      "content-type": file.mimeType,
      "content-length": String(file.sizeBytes),
      "content-disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
    },
  });
});

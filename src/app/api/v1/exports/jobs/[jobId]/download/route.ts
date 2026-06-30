import { fail } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { readExportJobDownload } from "@/features/exports/server/export-jobs-service";

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
    const file = await readExportJobDownload({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
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
  } catch (error) {
    return fail(error);
  }
}

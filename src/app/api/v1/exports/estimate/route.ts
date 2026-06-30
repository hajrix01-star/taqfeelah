import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { estimateRegisterExport } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

type EstimateRegisterExportInput = Parameters<typeof estimateRegisterExport>[0];

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const input = body as EstimateRegisterExportInput;
  return estimateRegisterExport({
    ...input,
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  });
});

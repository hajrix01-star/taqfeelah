import { ValidationError } from "@/core/errors/app-error";
import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { acknowledgeDuplicateSummaries } from "@/features/entries/server/acknowledge-duplicate-summaries";

export const dynamic = "force-dynamic";

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const entryIds = Array.isArray(body?.entryIds)
    ? body.entryIds.filter((value: unknown) => typeof value === "string")
    : [];
  if (!entryIds.length) {
    throw new ValidationError("Body field 'entryIds' must be a non-empty array.");
  }

  return acknowledgeDuplicateSummaries({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    date: typeof body?.date === "string" ? body.date : "",
    entryIds,
  });
});

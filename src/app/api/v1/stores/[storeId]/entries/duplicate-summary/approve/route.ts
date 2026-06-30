import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { approveDuplicateSummary } from "@/features/entries/server/approve-duplicate-summary";

export const dynamic = "force-dynamic";

type ApproveDuplicateSummaryInput = Parameters<typeof approveDuplicateSummary>[0];

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const payload = (
    body?.payload && typeof body.payload === "object"
      ? body.payload
      : { type: "summary", salesChannels: [] }
  ) as ApproveDuplicateSummaryInput["payload"];

  const created = await approveDuplicateSummary({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    date: typeof body?.date === "string" ? body.date : "",
    payload,
  });

  return { data: created, init: { status: 201 } };
});

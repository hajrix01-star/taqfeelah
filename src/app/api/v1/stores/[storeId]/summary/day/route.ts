import { ValidationError } from "@/core/errors/app-error";
import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { getStoreDaySummary } from "@/features/reports/server/get-store-day-summary";
import { recordStoreDaySummarySnapshot } from "@/features/reports/server/record-store-day-summary-snapshot";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(({ auth, params, searchParams }) => {
  const date = searchParams.get("date");
  if (!date) {
    throw new ValidationError("Query param 'date' is required.");
  }

  return getStoreDaySummary({
    storeId: params.storeId,
    date,
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  });
});

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request, searchParams }) => {
  const date = searchParams.get("date");
  if (!date) {
    throw new ValidationError("Query param 'date' is required.");
  }

  const body = await readJsonBody<Record<string, unknown>>(request);
  const totalSalesHalalas = Number(body?.totalSalesHalalas);
  const totalOutflowHalalas = Number(body?.totalOutflowHalalas);
  const note = typeof body?.note === "string" ? body.note : undefined;

  if (!Number.isInteger(totalSalesHalalas) || totalSalesHalalas < 0) {
    throw new ValidationError("Body field 'totalSalesHalalas' must be a non-negative integer.");
  }
  if (!Number.isInteger(totalOutflowHalalas) || totalOutflowHalalas < 0) {
    throw new ValidationError("Body field 'totalOutflowHalalas' must be a non-negative integer.");
  }

  const snapshot = await recordStoreDaySummarySnapshot({
    storeId: params.storeId,
    date,
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    totalSalesHalalas,
    totalOutflowHalalas,
    note,
  });

  const computed = await getStoreDaySummary({
    storeId: params.storeId,
    date,
    organizationId: auth.organizationId,
  });

  return {
    data: {
      ...computed,
      snapshot: {
        id: snapshot.id,
        createdAt: snapshot.createdAt,
        totalSalesHalalas,
        totalOutflowHalalas,
        netMovementHalalas: totalSalesHalalas - totalOutflowHalalas,
      },
    },
    init: { status: 201 },
  };
});

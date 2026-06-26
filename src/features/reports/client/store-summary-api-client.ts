import { fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import { setRuntimeApiIdMaps } from "@/core/client/runtime-api-maps-state";
import { resolveRuntimeApiContext } from "@/core/client/runtime-api-context";
import type {
  ApiPeriodSummary,
  FetchStoreSummaryArgs,
  ReportsRuntimeApiMapOverrides,
} from "@/features/reports/client/reports-client-types";

export function setSummaryRuntimeApiIdMaps(overrides: ReportsRuntimeApiMapOverrides): void {
  setRuntimeApiIdMaps(overrides);
}

function assertSummaryApiContext(
  context: ReturnType<typeof resolveRuntimeApiContext>,
  resource: string,
): asserts context is NonNullable<ReturnType<typeof resolveRuntimeApiContext>> {
  if (!context) {
    throw new Error(`${resource} API context missing/invalid: organizationId, actorUserId, or storeId mapping.`);
  }
}

function assertSummaryPeriodKey(value: string | undefined, key: string, resource: string): void {
  if (!value) {
    throw new Error(`${resource} API context missing/invalid: ${key}.`);
  }
}

function assertSummaryPayload(payload: unknown, resource: string): asserts payload is ApiPeriodSummary {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${resource} API returned invalid payload.`);
  }
}

export async function fetchStoreDaySummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date = "",
}: FetchStoreSummaryArgs): Promise<ApiPeriodSummary> {
  const context = resolveRuntimeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertSummaryApiContext(context, "day summary");
  assertSummaryPeriodKey(date, "date", "day summary");

  const search = new URLSearchParams({ date });
  const payload = await fetchApiJsonWithRuntimeContext(
    `/api/v1/stores/${context.storeId}/summary/day?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "day summary api failed",
      errorStyle: "status",
    },
  );
  assertSummaryPayload(payload, "day summary");
  return payload;
}

export async function fetchStoreMonthSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  month = "",
}: FetchStoreSummaryArgs): Promise<ApiPeriodSummary> {
  const context = resolveRuntimeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertSummaryApiContext(context, "month summary");
  assertSummaryPeriodKey(month, "month", "month summary");

  const search = new URLSearchParams({ month });
  const payload = await fetchApiJsonWithRuntimeContext(
    `/api/v1/stores/${context.storeId}/summary/month?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "month summary api failed",
      errorStyle: "status",
    },
  );
  assertSummaryPayload(payload, "month summary");
  return payload;
}

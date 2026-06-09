import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { setRuntimeApiIdMaps } from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";

export function setSummaryRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
}

function assertSummaryApiContext(context, resource) {
  if (!context) {
    throw new Error(`${resource} API context missing/invalid: organizationId, actorUserId, or storeId mapping.`);
  }
}

function assertSummaryPeriodKey(value, key, resource) {
  if (!value) {
    throw new Error(`${resource} API context missing/invalid: ${key}.`);
  }
}

function assertSummaryPayload(payload, resource) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${resource} API returned invalid payload.`);
  }
}

export async function fetchStoreDaySummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertSummaryApiContext(context, "day summary");
  assertSummaryPeriodKey(date, "date", "day summary");

  const search = new URLSearchParams({ date });
  const payload = await fetchApiJsonWithPrototypeContext(
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
  month,
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertSummaryApiContext(context, "month summary");
  assertSummaryPeriodKey(month, "month", "month summary");

  const search = new URLSearchParams({ month });
  const payload = await fetchApiJsonWithPrototypeContext(
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

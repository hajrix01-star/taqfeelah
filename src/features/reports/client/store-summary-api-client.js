import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { setRuntimeApiIdMaps } from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";

export function setSummaryRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
}

export async function fetchStoreDaySummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context || !date) return null;

  const search = new URLSearchParams({ date });
  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/summary/day?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "day summary api failed",
      errorStyle: "status",
    },
  );
}

export async function fetchStoreMonthSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  month,
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context || !month) return null;

  const search = new URLSearchParams({ month });
  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/summary/month?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "month summary api failed",
      errorStyle: "status",
    },
  );
}

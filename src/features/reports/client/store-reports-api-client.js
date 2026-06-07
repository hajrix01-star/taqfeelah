import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";

export function setReportsRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
}

function buildReportQuery({ storeId, from, to, extra = {} }) {
  const search = new URLSearchParams({ storeId, from, to });
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

async function fetchReport(path, {
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  from,
  to,
  extra = {},
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context || !from || !to) return null;

  return fetchApiJsonWithPrototypeContext(
    `/api/v1/reports/${path}?${buildReportQuery({
      storeId: context.storeId,
      from,
      to,
      extra,
    })}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: `${path} report api failed`,
      errorStyle: "status",
    },
  );
}

export async function fetchStorePeriodSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  from,
  to,
  period = "day",
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context || !from || !to) return null;

  let path = `/api/v1/stores/${context.storeId}/summary/period?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  if (period === "day" && from === to) {
    path = `/api/v1/stores/${context.storeId}/summary/day?date=${encodeURIComponent(from)}`;
  } else if (period === "month" && from.endsWith("-01") && to.slice(0, 7) === from.slice(0, 7)) {
    path = `/api/v1/stores/${context.storeId}/summary/month?month=${encodeURIComponent(from.slice(0, 7))}`;
  }

  return fetchApiJsonWithPrototypeContext(path, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "period summary api failed",
    errorStyle: "status",
  });
}

export function fetchStoreDaysReportViaApi(args) {
  return fetchReport("days", args);
}

export function fetchStoreChannelsReportViaApi(args) {
  return fetchReport("channels", args);
}

export function fetchStoreOutflowReportViaApi({
  categoryKey,
  includeTransactions = false,
  ...args
}) {
  return fetchReport("outflow", {
    ...args,
    extra: {
      categoryKey: categoryKey && categoryKey !== "all" ? categoryKey : "",
      includeTransactions: includeTransactions ? "true" : "",
    },
  });
}

export function fetchStoreAttachmentsReportViaApi(args) {
  return fetchReport("attachments", args);
}

export function getReportsApiMaps() {
  return getRuntimeApiMaps();
}

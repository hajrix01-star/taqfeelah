import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setReportsRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
  cachedMaps = null;
}

function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

function getMaps() {
  if (cachedMaps) return cachedMaps;
  cachedMaps = getCloseoutApiMaps();
  return cachedMaps;
}

function mapToUuid(value, map) {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
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
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !from || !to) {
    return null;
  }

  const response = await fetch(`/api/v1/reports/${path}?${buildReportQuery({
    storeId: mappedStoreId,
    from,
    to,
    extra,
  })}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`${path} report api failed: ${response.status}`);
  }
  return response.json();
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
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !from || !to) {
    return null;
  }

  let path = `/api/v1/stores/${mappedStoreId}/summary/period?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  if (period === "day" && from === to) {
    path = `/api/v1/stores/${mappedStoreId}/summary/day?date=${encodeURIComponent(from)}`;
  } else if (period === "month" && from.endsWith("-01") && to.slice(0, 7) === from.slice(0, 7)) {
    path = `/api/v1/stores/${mappedStoreId}/summary/month?month=${encodeURIComponent(from.slice(0, 7))}`;
  }

  const response = await fetch(path, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`period summary api failed: ${response.status}`);
  }
  return response.json();
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
  return getMaps();
}

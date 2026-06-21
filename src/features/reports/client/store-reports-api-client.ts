import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";
import type {
  ApiAttachmentsReport,
  ApiChannelsReport,
  ApiDaysReport,
  ApiOutflowReport,
  ApiPeriodSummary,
  FetchReportArgs,
  FetchStoreOutflowReportArgs,
  FetchStorePeriodSummaryArgs,
  ReportsRuntimeApiMapOverrides,
} from "@/features/reports/client/reports-client-types";

export function setReportsRuntimeApiIdMaps(overrides: ReportsRuntimeApiMapOverrides): void {
  setRuntimeApiIdMaps(overrides);
}

function assertReportApiContext(
  context: ReturnType<typeof resolvePrototypeApiContext>,
  resource: string,
): asserts context is NonNullable<ReturnType<typeof resolvePrototypeApiContext>> {
  if (!context) {
    throw new Error(`${resource} API context missing/invalid: organizationId, actorUserId, or storeId mapping.`);
  }
}

function assertReportRange({ from, to }: { from: string; to: string }, resource: string): void {
  if (!from || !to) {
    throw new Error(`${resource} API context missing/invalid: from/to range.`);
  }
}

function assertReportPayload(payload: unknown, resource: string): asserts payload is Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`${resource} API returned invalid payload.`);
  }
}

function buildReportQuery({
  storeId,
  from,
  to,
  extra = {},
}: {
  storeId: string;
  from: string;
  to: string;
  extra?: Record<string, unknown>;
}): string {
  const search = new URLSearchParams({ storeId, from, to });
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

async function fetchReport<T extends Record<string, unknown>>(
  path: string,
  {
    organizationId,
    actorUserId,
    actorRole,
    storeId,
    from,
    to,
    extra = {},
  }: FetchReportArgs,
): Promise<T> {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertReportApiContext(context, `${path} report`);
  assertReportRange({ from, to }, `${path} report`);

  const payload = await fetchApiJsonWithPrototypeContext(
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
  assertReportPayload(payload, `${path} report`);
  return payload as T;
}

export async function fetchStorePeriodSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  from,
  to,
  period = "day",
}: FetchStorePeriodSummaryArgs): Promise<ApiPeriodSummary> {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertReportApiContext(context, "period summary");
  assertReportRange({ from, to }, "period summary");

  let path = `/api/v1/stores/${context.storeId}/summary/period?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  if (period === "day" && from === to) {
    path = `/api/v1/stores/${context.storeId}/summary/day?date=${encodeURIComponent(from)}`;
  } else if (period === "month" && from.endsWith("-01") && to.slice(0, 7) === from.slice(0, 7)) {
    path = `/api/v1/stores/${context.storeId}/summary/month?month=${encodeURIComponent(from.slice(0, 7))}`;
  }

  const payload = await fetchApiJsonWithPrototypeContext(path, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "period summary api failed",
    errorStyle: "status",
  });
  assertReportPayload(payload, "period summary");
  return payload as ApiPeriodSummary;
}

export function fetchStoreDaysReportViaApi(args: FetchReportArgs): Promise<ApiDaysReport> {
  return fetchReport<ApiDaysReport>("days", args);
}

export function fetchStoreChannelsReportViaApi(args: FetchReportArgs): Promise<ApiChannelsReport> {
  return fetchReport<ApiChannelsReport>("channels", args);
}

export function fetchStoreOutflowReportViaApi({
  categoryKey,
  includeTransactions = false,
  ...args
}: FetchStoreOutflowReportArgs): Promise<ApiOutflowReport> {
  return fetchReport<ApiOutflowReport>("outflow", {
    ...args,
    extra: {
      categoryKey: categoryKey && categoryKey !== "all" ? categoryKey : "",
      includeTransactions: includeTransactions ? "true" : "",
    },
  });
}

export function fetchStoreAttachmentsReportViaApi(args: FetchReportArgs): Promise<ApiAttachmentsReport> {
  return fetchReport<ApiAttachmentsReport>("attachments", args);
}

export function getReportsApiMaps() {
  return getRuntimeApiMaps();
}

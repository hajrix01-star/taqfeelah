import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";
import { monthToDateRange } from "@/features/reports/server/report-date-range";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export function parseReportRouteQuery(searchParams: URLSearchParams) {
  const storeId = searchParams.get("storeId");
  if (!storeId) {
    throw new ValidationError("Query param 'storeId' is required.");
  }
  const parsedStoreId = z.string().uuid().safeParse(storeId);
  if (!parsedStoreId.success) {
    throw new ValidationError("Query param 'storeId' must be a UUID.");
  }

  const month = searchParams.get("month");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (month) {
    const range = monthToDateRange(month);
    return {
      storeId: parsedStoreId.data,
      from: range.from,
      to: range.to,
      month,
      categoryKey: searchParams.get("categoryKey") || undefined,
      includeTransactions: searchParams.get("includeTransactions") === "true",
    };
  }

  const fromParsed = dateSchema.safeParse(fromParam);
  const toParsed = dateSchema.safeParse(toParam);
  if (!fromParsed.success || !toParsed.success) {
    throw new ValidationError("Query params 'from' and 'to' (YYYY-MM-DD) or 'month' (YYYY-MM) are required.");
  }

  return {
    storeId: parsedStoreId.data,
    from: fromParsed.data,
    to: toParsed.data,
    month: null as string | null,
    categoryKey: searchParams.get("categoryKey") || undefined,
    includeTransactions: searchParams.get("includeTransactions") === "true",
  };
}

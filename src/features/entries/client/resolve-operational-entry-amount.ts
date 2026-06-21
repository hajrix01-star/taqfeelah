import {
  resolveSummaryEntrySalesAmountRiyals,
  sumUiAmounts,
} from "@/domain/cash-movement/calculations";
import { filterSummaryChannelRows } from "./register-operation-display";
import type { OperationalEntry } from "./entries-client-types";

type OperationalEntryAmountSource = Pick<OperationalEntry, "type" | "amount" | "salesChannels">;

export function resolveOperationalEntrySalesAmount(
  entry: OperationalEntryAmountSource | null | undefined,
  salesChannelFilter = "all",
): number {
  if (!entry) return 0;
  if (entry.type !== "summary") return Number(entry.amount ?? 0);
  if (salesChannelFilter !== "all") {
    return sumUiAmounts(
      filterSummaryChannelRows(entry as OperationalEntry, salesChannelFilter)
        .map((row) => Number(row.amount ?? 0)),
    );
  }
  return resolveSummaryEntrySalesAmountRiyals({
    type: "summary",
    amount: Number(entry.amount ?? 0),
    salesChannels: (entry.salesChannels || []).map((row) => ({
      amount: Number(row.amount ?? 0),
    })),
  });
}

export function signedOperationalEntryAmount(
  entry: OperationalEntryAmountSource | null | undefined,
  salesChannelFilter = "all",
): number {
  if (!entry) return 0;
  const magnitude = entry.type === "summary"
    ? resolveOperationalEntrySalesAmount(entry, salesChannelFilter)
    : Number(entry.amount ?? 0);
  return entry.type === "summary" ? magnitude : -magnitude;
}

export function sumOperationalSummaryEntryAmounts(
  entries: OperationalEntryAmountSource[] = [],
  salesChannelFilter = "all",
): number {
  return sumUiAmounts(
    entries
      .filter((entry) => entry.type === "summary")
      .map((entry) => resolveOperationalEntrySalesAmount(entry, salesChannelFilter)),
  );
}

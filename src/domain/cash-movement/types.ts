export type EntryKind = "summary" | "purchases" | "expense" | "withdrawal";

export type MovementRow = {
  type: EntryKind;
  amountHalalas: number;
};

export type DaySummary = {
  totalSalesHalalas: number;
  totalOutflowHalalas: number;
  netMovementHalalas: number;
  outflowRatio: string;
  outflowRatioStatus: "calculable" | "notCalculable";
};

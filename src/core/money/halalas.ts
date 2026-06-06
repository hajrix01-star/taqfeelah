export function toHalalas(riyals: number): number {
  return Math.round(Number(riyals) * 100);
}

export function toRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}

export type OutflowRatioResult = {
  ratio: string;
  status: "calculable" | "notCalculable";
};

export function formatOutflowRatio(
  salesHalalas: number,
  outflowHalalas: number,
): OutflowRatioResult {
  if (salesHalalas === 0 && outflowHalalas > 0) {
    return { ratio: "—", status: "notCalculable" };
  }

  const pct = salesHalalas === 0 ? 0 : (outflowHalalas / salesHalalas) * 100;
  return { ratio: `${pct.toFixed(1)}%`, status: "calculable" };
}

export function mapDaySummaryToUiTotals(apiSummary) {
  const salesHalalas = Number(apiSummary?.totalSales?.amountHalalas || 0);
  const outflowHalalas = Number(apiSummary?.totalOutflow?.amountHalalas || 0);
  const netHalalas = Number(apiSummary?.netMovement?.amountHalalas ?? (salesHalalas - outflowHalalas));
  const ratio = apiSummary?.outflowRatioStatus === "notCalculable"
    ? "—"
    : (typeof apiSummary?.outflowRatio === "string" ? apiSummary.outflowRatio : "0.0%");

  return {
    sales: salesHalalas / 100,
    expense: outflowHalalas / 100,
    net: netHalalas / 100,
    ratio,
    proofs: Number(apiSummary?.attachmentCount || 0),
    pending: Number(apiSummary?.pendingReviewCount || 0),
  };
}

export function combineUiTotals(records) {
  const list = Array.isArray(records) ? records : [];
  const combined = list.reduce((total, record) => ({
    sales: total.sales + Number(record?.sales || 0),
    expense: total.expense + Number(record?.expense || 0),
    net: total.net + Number(record?.net || 0),
    proofs: total.proofs + Number(record?.proofs || 0),
    pending: total.pending + Number(record?.pending || 0),
  }), { sales: 0, expense: 0, net: 0, proofs: 0, pending: 0 });

  const ratio = combined.sales > 0
    ? `${((combined.expense / combined.sales) * 100).toFixed(1)}%`
    : combined.expense > 0
      ? "—"
      : "0.0%";

  return { ...combined, ratio };
}

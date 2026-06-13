"use client";

import { useCallback, useMemo, useState } from "react";
import { sanitizeAmountInput, toAmount } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";
import { computeCloseoutTotals, salesRecordFromChannels } from "../daily-closeouts/closeout-calculations";
import { withCloseoutTotals } from "../daily-closeouts/daily-closeouts-demo-store";
import {
  buildCloseoutEntryTitles,
  buildCloseoutOutflowRow,
  todayIsoDate,
} from "./daily-closeout-entry-helpers";

export function useDailyCloseoutEntryState({
  lang,
  notebookTheme,
  initialCloseout,
  salesChannels,
  storeName,
  isOwnerEdit = false,
  onSubmit,
  channelLabel,
}) {
  const labelChannel = channelLabel || ((channel) => (lang === "ar" ? channel.nameAr || channel.nameEn : channel.nameEn || channel.nameAr) || channel.id);
  const [date, setDate] = useState(initialCloseout?.date || todayIsoDate());
  const [salesValues, setSalesValues] = useState(() => {
    const record = initialCloseout?.sales || {};
    const values = {};
    salesChannels.forEach((ch) => {
      const row = record[ch.id] || Object.values(record).find((item) => item.channelId === ch.id);
      values[ch.id] = row ? String(row.amount || "") : "";
    });
    return values;
  });
  const [outflows, setOutflows] = useState(initialCloseout?.outflows || []);
  const [attachments, setAttachments] = useState(initialCloseout?.attachments || []);
  const [previewAttachment, setPreviewAttachment] = useState("");
  const [outType, setOutType] = useState("purchases");
  const [expenseCategory, setExpenseCategory] = useState("maintenance");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");

  const totals = useMemo(() => {
    const salesRecord = salesRecordFromChannels(
      salesChannels,
      Object.fromEntries(salesChannels.map((ch) => [ch.id, toAmount(salesValues[ch.id])])),
    );
    return computeCloseoutTotals(salesRecord, outflows);
  }, [outflows, salesChannels, salesValues]);

  const titles = useMemo(() => buildCloseoutEntryTitles(lang), [lang]);

  const buildCloseout = useCallback((outflowRows = outflows) => {
    const salesRecord = salesRecordFromChannels(
      salesChannels,
      Object.fromEntries(salesChannels.map((ch) => [ch.id, toAmount(salesValues[ch.id])])),
    );
    const base = {
      ...initialCloseout,
      date,
      storeName,
      notebookTheme: initialCloseout?.notebookTheme || notebookTheme || "yellow",
      sales: salesRecord,
      outflows: outflowRows,
      attachments,
    };
    return withCloseoutTotals(base);
  }, [attachments, date, initialCloseout, notebookTheme, outflows, salesChannels, salesValues, storeName]);

  const buildOutflowRow = useCallback((amountValue, noteValue = outNote) => buildCloseoutOutflowRow({
    lang,
    outType,
    expenseCategory,
    outNote: noteValue,
    amountValue,
  }), [expenseCategory, lang, outNote, outType]);

  const pushOutflow = useCallback(() => {
    const row = buildOutflowRow(outAmount);
    if (!row) return;
    setOutflows((current) => [...current, row]);
    setOutAmount("");
    setOutNote("");
  }, [buildOutflowRow, outAmount]);

  const removeOutflow = useCallback((id) => {
    setOutflows((current) => current.filter((item) => item.id !== id));
  }, []);

  const onFiles = useCallback((event) => {
    const files = [...(event.target.files || [])].slice(0, 6 - attachments.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((current) => [...current, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }, [attachments.length]);

  const validateDate = useCallback(() => {
    if (!date) {
      window.alert(lang === "ar" ? "اختر تاريخ التقفيلة" : "Pick a closeout date");
      return false;
    }
    if (date > todayIsoDate()) {
      window.alert(lang === "ar" ? "لا يمكن اختيار تاريخ مستقبلي" : "Future dates are not allowed");
      return false;
    }
    return true;
  }, [date, lang]);

  const handleSubmit = useCallback(async () => {
    if (!validateDate()) return;
    if (salesChannels.length === 0) {
      window.alert(lang === "ar" ? "لا توجد قنوات بيع مفعّلة لهذا المحل." : "No active sales channels for this store.");
      return;
    }
    const pendingOutflow = buildOutflowRow(outAmount);
    const nextOutflows = pendingOutflow ? [...outflows, pendingOutflow] : outflows;
    if (pendingOutflow) {
      setOutflows(nextOutflows);
      setOutAmount("");
      setOutNote("");
    }
    const closeout = buildCloseout(nextOutflows);
    if ((closeout.totals?.totalSales || 0) <= 0) {
      window.alert(lang === "ar" ? "أدخل مبلغ الداخل" : "Enter sales amount");
      return;
    }
    await onSubmit(closeout, { isOwnerEdit });
  }, [buildCloseout, buildOutflowRow, isOwnerEdit, lang, onSubmit, outAmount, outflows, salesChannels.length, validateDate]);

  const updateSalesValue = useCallback((channelId, value) => {
    setSalesValues((current) => ({
      ...current,
      [channelId]: sanitizeAmountInput(value),
    }));
  }, []);

  const removeAttachment = useCallback((index) => {
    setAttachments((current) => current.filter((_, i) => i !== index));
  }, []);

  return {
    date,
    setDate,
    salesValues,
    outflows,
    attachments,
    previewAttachment,
    setPreviewAttachment,
    outType,
    setOutType,
    expenseCategory,
    setExpenseCategory,
    outAmount,
    setOutAmount,
    outNote,
    setOutNote,
    totals,
    titles,
    labelChannel,
    pushOutflow,
    removeOutflow,
    onFiles,
    handleSubmit,
    updateSalesValue,
    removeAttachment,
    todayIso: todayIsoDate,
  };
}

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { text } from "../../components/prototype-runtime/prototype-runtime-demo-data";
import { prepareAttachment } from "@/features/attachments/client/prototype-attachment-storage";
import { sanitizeAmountInput, toAmount } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";
import { computeCloseoutTotals, salesRecordFromChannels } from "../daily-closeouts/closeout-calculations";
import { withCloseoutTotals } from "../daily-closeouts/daily-closeouts-demo-store";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { confirmCloseoutSubmit } from "@/lib/ui/app-dialog/app-dialog-helpers";
import {
  attachmentDataUrlsFromList,
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
  const [attachmentProcessing, setAttachmentProcessing] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [outflowAttachmentProcessingId, setOutflowAttachmentProcessingId] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState("");
  const [outType, setOutType] = useState("purchases");
  const [expenseCategory, setExpenseCategory] = useState("maintenance");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");
  const submitInFlightRef = useRef(false);

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
    attachments: [],
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

  const removeOutflowAttachment = useCallback((id) => {
    setOutflows((current) => current.map((item) => (
      item.id === id ? { ...item, attachments: [] } : item
    )));
  }, []);

  const addOutflowAttachment = useCallback(async (outflowId, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setOutflowAttachmentProcessingId(outflowId);
    try {
      const prepared = await prepareAttachment(file);
      setOutflows((current) => current.map((item) => (
        item.id === outflowId
          ? { ...item, attachments: attachmentDataUrlsFromList([prepared]) }
          : item
      )));
    } catch (failure) {
      await appAlert({ lang, title: text(lang, failure?.message === "invalid" ? "invalidAttachment" : "attachmentTooLarge"), variant: "warning" });
    } finally {
      setOutflowAttachmentProcessingId("");
    }
  }, [lang]);

  const onFiles = useCallback(async (event) => {
    const remaining = Math.max(0, 6 - attachments.length);
    const files = [...(event.target.files || [])].slice(0, remaining);
    event.target.value = "";
    if (!files.length) return;

    setAttachmentProcessing(true);
    setAttachmentError("");
    const prepared = [];
    try {
      for (const file of files) {
        try {
          prepared.push(await prepareAttachment(file));
        } catch (failure) {
          setAttachmentError(text(
            lang,
            failure?.message === "invalid" ? "invalidAttachment" : "attachmentTooLarge",
          ));
          break;
        }
      }
      if (prepared.length) {
        setAttachments((current) => [...current, ...prepared].slice(0, 6));
      }
    } finally {
      setAttachmentProcessing(false);
    }
  }, [attachments.length, lang]);

  const validateDate = useCallback(async () => {
    if (!date) {
      await appAlert({ lang, title: text(lang, "chooseCloseoutDate"), variant: "warning" });
      return false;
    }
    if (date > todayIsoDate()) {
      await appAlert({ lang, title: text(lang, "futureDateNotAllowed"), variant: "warning" });
      return false;
    }
    return true;
  }, [date, lang]);

  const handleSubmit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (!initialCloseout?.storeId) {
      await appAlert({ lang, title: text(lang, "chooseStoreToStartEntry"), variant: "info" });
      return;
    }
    if (!(await validateDate())) return;
    if (attachmentProcessing || outflowAttachmentProcessingId) {
      await appAlert({ lang, title: text(lang, "waitForImageProcessing"), variant: "warning" });
      return;
    }
    if (salesChannels.length === 0) {
      await appAlert({ lang, title: text(lang, "noSalesChannels"), variant: "info" });
      return;
    }
    const pendingOutflow = buildOutflowRow(outAmount);
    const nextOutflows = pendingOutflow ? [...outflows, pendingOutflow] : outflows;
    const closeout = buildCloseout(nextOutflows);
    if ((closeout.totals?.totalSales || 0) <= 0) {
      await appAlert({ lang, title: text(lang, "enterSalesAmount"), variant: "warning" });
      return;
    }
    submitInFlightRef.current = true;
    try {
      if (!(await confirmCloseoutSubmit(lang, text, { isOwnerEdit }))) return;
      if (pendingOutflow) {
        setOutflows(nextOutflows);
        setOutAmount("");
        setOutNote("");
      }
      await onSubmit(closeout, { isOwnerEdit });
    } finally {
      submitInFlightRef.current = false;
    }
  }, [
    attachmentProcessing,
    buildCloseout,
    buildOutflowRow,
    initialCloseout?.storeId,
    isOwnerEdit,
    lang,
    onSubmit,
    outAmount,
    outflowAttachmentProcessingId,
    outflows,
    salesChannels.length,
    validateDate,
  ]);

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
    attachmentProcessing,
    attachmentError,
    outflowAttachmentProcessingId,
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
    removeOutflowAttachment,
    addOutflowAttachment,
    onFiles,
    handleSubmit,
    updateSalesValue,
    removeAttachment,
    todayIso: todayIsoDate,
  };
}
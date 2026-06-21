"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { text } from "../../components/prototype-runtime/prototype-runtime-demo-data";
import { prepareAttachment } from "@/features/attachments/client/prototype-attachment-storage";
import { sanitizeAmountInput, toAmount } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";
import { computeCloseoutTotals } from "../daily-closeouts/closeout-calculations";
import {
  buildCloseoutSalesFromChannelValues,
  findCloseoutSalesRowForChannel,
  mergeCloseoutSalesFromChannelValues,
  normalizeCloseoutSalesToArray,
} from "../daily-closeouts/closeout-sales-normalize";
import { withCloseoutTotals } from "../daily-closeouts/daily-closeouts-demo-store";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { confirmCloseoutSubmit } from "@/lib/ui/app-dialog/app-dialog-helpers";
import type {
  CloseoutSalesChannelRow,
  CloseoutTotals,
  DailyCloseoutRecord,
  NotebookThemeId,
  SalesChannelConfig,
} from "@/features/daily-closeouts/daily-closeouts-types";
import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { CloseoutOutflowRow } from "./employee-closeouts-types";
import {
  attachmentDataUrlsFromList,
  buildCloseoutEntryTitles,
  buildCloseoutOutflowRow,
  todayIsoDate,
} from "./daily-closeout-entry-helpers";

type PreparedAttachment = { dataUrl?: string } | string;

export function useDailyCloseoutEntryState({
  lang,
  notebookTheme,
  initialCloseout,
  salesChannels,
  storeName,
  isOwnerEdit = false,
  onSubmit,
  channelLabel,
}: {
  lang: CloseoutSyncLang;
  notebookTheme?: NotebookThemeId | string;
  initialCloseout: DailyCloseoutRecord;
  salesChannels: SalesChannelConfig[];
  storeName?: string;
  isOwnerEdit?: boolean;
  onSubmit: (closeout: DailyCloseoutRecord, meta: { isOwnerEdit: boolean }) => void | Promise<void>;
  channelLabel?: (channel: SalesChannelConfig) => string;
}) {
  const labelChannel = useCallback(
    (channel: SalesChannelConfig) => (
      channelLabel
        ? channelLabel(channel)
        : ((lang === "ar" ? channel.nameAr || channel.nameEn : channel.nameEn || channel.nameAr) || channel.id)
    ),
    [channelLabel, lang],
  );
  const [date, setDate] = useState(initialCloseout?.date || todayIsoDate());
  const [salesValues, setSalesValues] = useState<Record<string, string>>(() => {
    const salesRows = normalizeCloseoutSalesToArray(initialCloseout?.sales);
    const values: Record<string, string> = {};
    salesChannels.forEach((ch) => {
      const row = findCloseoutSalesRowForChannel(salesRows, ch, labelChannel(ch));
      values[ch.id] = row ? String(row.amount || "") : "";
    });
    return values;
  });
  useEffect(() => {
    if (!isOwnerEdit || salesChannels.length === 0) return;
    setSalesValues((current) => {
      const salesRows = normalizeCloseoutSalesToArray(initialCloseout?.sales);
      let changed = false;
      const next = { ...current };
      salesChannels.forEach((ch) => {
        if (next[ch.id]) return;
        const row = findCloseoutSalesRowForChannel(salesRows, ch, labelChannel(ch));
        if (!row) return;
        next[ch.id] = String(row.amount || "");
        changed = true;
      });
      return changed ? next : current;
    });
  }, [initialCloseout?.sales, isOwnerEdit, labelChannel, salesChannels]);
  const [outflows, setOutflows] = useState<CloseoutOutflowRow[]>(
    (initialCloseout?.outflows as CloseoutOutflowRow[] | undefined) || [],
  );
  const [attachments, setAttachments] = useState<PreparedAttachment[]>(
    (initialCloseout?.attachments as PreparedAttachment[] | undefined) || [],
  );
  const [attachmentProcessing, setAttachmentProcessing] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [outflowAttachmentProcessingId, setOutflowAttachmentProcessingId] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState("");
  const [outType, setOutType] = useState("purchases");
  const [expenseCategory, setExpenseCategory] = useState("maintenance");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");
  const submitInFlightRef = useRef(false);

  const titles = useMemo(() => buildCloseoutEntryTitles(lang), [lang]);

  const buildOutflowRow = useCallback(
    (amountValue: string | number, noteValue = outNote) => buildCloseoutOutflowRow({
      lang,
      outType,
      expenseCategory,
      outNote: noteValue,
      amountValue,
      attachments: [],
    }),
    [expenseCategory, lang, outNote, outType],
  );

  const totals = useMemo((): CloseoutTotals => {
    const salesRows = mergeCloseoutSalesFromChannelValues(
      salesChannels,
      Object.fromEntries(salesChannels.map((ch) => [ch.id, toAmount(salesValues[ch.id])])),
      initialCloseout?.sales,
    );
    return computeCloseoutTotals(salesRows, outflows);
  }, [initialCloseout?.sales, outflows, salesChannels, salesValues]);

  const buildCloseout = useCallback((outflowRows: CloseoutOutflowRow[] = outflows): DailyCloseoutRecord => {
    const salesRows = isOwnerEdit
      ? mergeCloseoutSalesFromChannelValues(
        salesChannels,
        Object.fromEntries(salesChannels.map((ch) => [ch.id, toAmount(salesValues[ch.id])])),
        initialCloseout?.sales,
      )
      : buildCloseoutSalesFromChannelValues(
        salesChannels,
        Object.fromEntries(salesChannels.map((ch) => [ch.id, toAmount(salesValues[ch.id])])),
      );
    const base: DailyCloseoutRecord = {
      ...initialCloseout,
      date,
      storeName,
      notebookTheme: initialCloseout?.notebookTheme || notebookTheme || "yellow",
      sales: salesRows,
      outflows: outflowRows,
      attachments,
    };
    return withCloseoutTotals(base);
  }, [attachments, date, initialCloseout, isOwnerEdit, notebookTheme, outflows, salesChannels, salesValues, storeName]);

  const pushOutflow = useCallback(() => {
    const row = buildOutflowRow(outAmount);
    if (!row) return;
    setOutflows((current) => [...current, row]);
    setOutAmount("");
    setOutNote("");
  }, [buildOutflowRow, outAmount]);

  const removeOutflow = useCallback((id: string) => {
    setOutflows((current) => current.filter((item) => item.id !== id));
  }, []);

  const removeOutflowAttachment = useCallback((id: string) => {
    setOutflows((current) => current.map((item) => (
      item.id === id ? { ...item, attachments: [] } : item
    )));
  }, []);

  const addOutflowAttachment = useCallback(async (outflowId: string, event: ChangeEvent<HTMLInputElement>) => {
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
      const message = failure instanceof Error ? failure.message : "";
      await appAlert({ lang, title: text(lang, message === "invalid" ? "invalidAttachment" : "attachmentTooLarge"), variant: "warning" });
    } finally {
      setOutflowAttachmentProcessingId("");
    }
  }, [lang]);

  const onFiles = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const remaining = Math.max(0, 6 - attachments.length);
    const files = [...(event.target.files || [])].slice(0, remaining);
    event.target.value = "";
    if (!files.length) return;

    setAttachmentProcessing(true);
    setAttachmentError("");
    const prepared: PreparedAttachment[] = [];
    try {
      for (const file of files) {
        try {
          prepared.push(await prepareAttachment(file));
        } catch (failure) {
          const message = failure instanceof Error ? failure.message : "";
          setAttachmentError(text(
            lang,
            message === "invalid" ? "invalidAttachment" : "attachmentTooLarge",
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
    const closeout = buildCloseout();
    if ((closeout.totals?.totalSales || 0) <= 0) {
      await appAlert({ lang, title: text(lang, "enterSalesAmount"), variant: "warning" });
      return;
    }
    submitInFlightRef.current = true;
    try {
      if (!(await confirmCloseoutSubmit(lang, text, { isOwnerEdit }))) return;
      setOutAmount("");
      setOutNote("");
      await onSubmit(closeout, { isOwnerEdit });
    } finally {
      submitInFlightRef.current = false;
    }
  }, [
    attachmentProcessing,
    buildCloseout,
    initialCloseout?.storeId,
    isOwnerEdit,
    lang,
    onSubmit,
    outflowAttachmentProcessingId,
    salesChannels.length,
    validateDate,
  ]);

  const updateSalesValue = useCallback((channelId: string, value: string) => {
    setSalesValues((current) => ({
      ...current,
      [channelId]: sanitizeAmountInput(value),
    }));
  }, []);

  const removeAttachment = useCallback((index: number) => {
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

export type DailyCloseoutEntryState = ReturnType<typeof useDailyCloseoutEntryState>;

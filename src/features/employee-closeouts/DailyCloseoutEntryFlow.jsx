"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import { notebookLinesBackground } from "../daily-closeouts/notebook-themes";
import { computeCloseoutTotals, salesRecordFromChannels } from "../daily-closeouts/closeout-calculations";
import { withCloseoutTotals } from "../daily-closeouts/daily-closeouts-demo-store";

const EXPENSE_CATEGORIES = [
  { id: "electricity", ar: "كهرباء", en: "Electricity" },
  { id: "phone", ar: "هاتف", en: "Phone" },
  { id: "rent", ar: "إيجار", en: "Rent" },
  { id: "maintenance", ar: "صيانة", en: "Maintenance" },
  { id: "salary", ar: "راتب", en: "Salary" },
  { id: "other", ar: "أخرى", en: "Other" },
];

const OUTFLOW_TYPES = [
  { id: "purchases", ar: "مشتريات", en: "Purchases" },
  { id: "expense", ar: "مصروف", en: "Expense" },
  { id: "withdrawal", ar: "سحب", en: "Withdrawal" },
];

function money(value, lang) {
  return Number(value || 0).toLocaleString(lang === "ar" ? "en-US" : "en-US");
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const moneyInputClass = "w-full bg-transparent text-center text-sm font-black outline-none [direction:ltr]";

function EntrySection({ number, title, children, lang }) {
  const badgeOnLeft = lang === "ar";
  return (
    <div className={`relative mb-4 space-y-4 rounded-2xl border border-[#E8E1D4] bg-[rgba(255,253,246,0.72)] p-4 ${badgeOnLeft ? "pl-12" : "pr-12"}`}>
      <span
        className={`absolute -top-px flex h-8 w-8 items-center justify-center bg-[#D69C2F] text-sm font-black text-white ${badgeOnLeft ? "-left-px rounded-br-2xl rounded-tl-2xl" : "-right-px rounded-bl-2xl rounded-tr-2xl"}`}
      >
        {number}
      </span>
      <h2 className="text-base font-black text-[#112A46]">{title}</h2>
      {children}
    </div>
  );
}

export default function DailyCloseoutEntryFlow({
  lang,
  notebookTheme,
  closeout: initialCloseout,
  salesChannels,
  storeName,
  isResubmit = false,
  onCancel,
  onSaveDraft,
  onSubmit,
  findForStoreDate,
  channelLabel,
  saving = false,
}) {
  const labelChannel = channelLabel || ((channel) => (lang === "ar" ? channel.nameAr || channel.nameEn : channel.nameEn || channel.nameAr) || channel.id);
  const [phase, setPhase] = useState(isResubmit ? "form" : "date");
  const [date, setDate] = useState(initialCloseout?.date || todayIso());
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
  const [outType, setOutType] = useState("purchases");
  const [expenseCategory, setExpenseCategory] = useState("maintenance");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");

  const totals = useMemo(() => {
    const salesRecord = salesRecordFromChannels(
      salesChannels,
      Object.fromEntries(salesChannels.map((ch) => [ch.id, salesValues[ch.id] || 0])),
    );
    return computeCloseoutTotals(salesRecord, outflows);
  }, [outflows, salesChannels, salesValues]);

  const titles = {
    date: lang === "ar" ? "اختر التاريخ" : "Pick date",
    sales: lang === "ar" ? "الداخل" : "Sales",
    outflows: lang === "ar" ? "الخارج" : "Outflows",
    photos: lang === "ar" ? "صور الإثبات" : "Proof photos",
    review: lang === "ar" ? "المراجعة" : "Review",
  };

  useEffect(() => {
    if (phase !== "form") return;
    onSaveDraft(buildCloseout(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, date, salesValues, outflows, attachments]);

  function buildCloseout(finalize) {
    const salesRecord = salesRecordFromChannels(
      salesChannels,
      Object.fromEntries(salesChannels.map((ch) => [ch.id, salesValues[ch.id] || 0])),
    );
    const base = {
      ...initialCloseout,
      date,
      storeName,
      notebookTheme: initialCloseout?.notebookTheme || notebookTheme || "yellow",
      sales: salesRecord,
      outflows,
      attachments,
    };
    return withCloseoutTotals(base);
  }

  const pushOutflow = () => {
    const amount = Number(outAmount || 0);
    if (!amount) return;
    let category = null;
    let typeLabel = OUTFLOW_TYPES.find((item) => item.id === outType)?.[lang === "ar" ? "ar" : "en"] || outType;
    if (outType === "expense") {
      const cat = EXPENSE_CATEGORIES.find((item) => item.id === expenseCategory);
      category = lang === "ar" ? cat?.ar : cat?.en;
      typeLabel = lang === "ar" ? "مصروف" : "Expense";
    }
    setOutflows((current) => [
      ...current,
      {
        id: `out-${Date.now()}`,
        type: outType,
        typeLabel,
        category,
        categoryId: outType === "expense" ? expenseCategory : null,
        note: outNote.trim(),
        amount,
        attachments: [],
      },
    ]);
    setOutAmount("");
    setOutNote("");
  };

  const removeOutflow = (id) => setOutflows((current) => current.filter((item) => item.id !== id));

  const onFiles = (event) => {
    const files = [...(event.target.files || [])].slice(0, 6 - attachments.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((current) => [...current, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  };

  const validateDate = () => {
    if (date > todayIso()) {
      window.alert(lang === "ar" ? "لا يمكن اختيار تاريخ مستقبلي" : "Future dates are not allowed");
      return false;
    }
    return true;
  };

  const continueToForm = () => {
    if (!validateDate()) return;
    onSaveDraft(buildCloseout(false));
    setPhase("form");
  };

  const saveDraft = () => {
    onSaveDraft(buildCloseout(false));
    window.alert(lang === "ar" ? "تم حفظ المسودة" : "Draft saved");
  };

  const handleSubmit = async () => {
    if (salesChannels.length === 0) {
      window.alert(lang === "ar" ? "لا توجد قنوات بيع مفعّلة لهذا المحل." : "No active sales channels for this store.");
      return;
    }
    if (totals.totalSales <= 0) {
      window.alert(lang === "ar" ? "أدخل مبلغ الداخل" : "Enter sales amount");
      return;
    }
    await onSubmit(buildCloseout(true), { isResubmit });
  };

  return (
    <div className="absolute inset-0 z-[50] flex flex-col" style={notebookLinesBackground(notebookTheme)}>
      <header
        className="relative z-[2] flex shrink-0 items-center justify-between border-b border-[#ECE6DA]/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]"
        style={notebookLinesBackground(notebookTheme)}
      >
        <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-black">{lang === "ar" ? (isResubmit ? "تعديل التقفيلة" : "تقفيلة يوم جديد") : (isResubmit ? "Edit closeout" : "New closeout")}</p>
        <span className="w-9" />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <NotebookScrollSurface theme={notebookTheme} lang={lang}>
          <div className="taq-owner-page taq-notebook-body pb-36 pt-2">
            {phase === "date" && (
              <EntrySection number={1} title={titles.date} lang={lang}>
                <input
                  type="date"
                  max={todayIso()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-black/[0.06]"
                />
                <p className="text-center text-taq-meta font-bold text-[#827762]">{storeName}</p>
              </EntrySection>
            )}
            {phase === "form" && (
              <>
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#E8E1D4] bg-[rgba(255,253,248,0.9)] px-4 py-3">
                  <div>
                    <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تاريخ التقفيلة" : "Closeout date"}</p>
                    <p className="text-sm font-black tabular-nums text-[#112A46]">{date}</p>
                  </div>
                  <button type="button" onClick={() => setPhase("date")} className="rounded-xl bg-white px-3 py-2 text-taq-meta font-black ring-1 ring-black/[0.06]">
                    {lang === "ar" ? "تغيير" : "Change"}
                  </button>
                </div>
                <EntrySection number={2} title={titles.sales} lang={lang}>
                  {salesChannels.length === 0 ? (
                    <p className="rounded-2xl bg-[#FFF1EE] p-3 text-xs font-bold text-[#B44747]">{lang === "ar" ? "لا توجد قنوات بيع مفعّلة." : "No active sales channels."}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {salesChannels.map((channel) => (
                        <label key={channel.id} className="flex flex-col items-center rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]">
                          <span className="mb-2 block w-full text-taq-meta font-bold text-[#827762]">{labelChannel(channel)}</span>
                          <input
                            inputMode="decimal"
                            dir="ltr"
                            value={salesValues[channel.id] || ""}
                            onChange={(event) => setSalesValues((current) => ({ ...current, [channel.id]: event.target.value }))}
                            className={moneyInputClass}
                            placeholder="0"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl border border-[#E8E1D4] bg-[#FAF3E3] px-3 py-3 font-extrabold">
                    <span className="text-sm">{lang === "ar" ? "إجمالي الداخل" : "Total sales"}</span>
                    <span className="tabular-nums text-[#112A46]">{money(totals.totalSales, lang)} ر.س</span>
                  </div>
                </EntrySection>
                <EntrySection number={3} title={titles.outflows} lang={lang}>
                  <div className="flex flex-wrap gap-2">
                    {OUTFLOW_TYPES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOutType(item.id)}
                        className={`rounded-full px-3 py-2 text-taq-meta font-black ${outType === item.id ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-[#E8E1D4]"}`}
                      >
                        {lang === "ar" ? item.ar : item.en}
                      </button>
                    ))}
                  </div>
                  {outType === "expense" && (
                    <div className="flex flex-wrap gap-2">
                      {EXPENSE_CATEGORIES.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setExpenseCategory(item.id)}
                          className={`rounded-full px-2.5 py-1.5 text-taq-meta font-black ${expenseCategory === item.id ? "bg-[#E4B84A] text-[#112A46]" : "bg-white ring-1 ring-[#E8E1D4]"}`}
                        >
                          {lang === "ar" ? item.ar : item.en}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-stretch gap-2">
                    <input
                      value={outAmount}
                      onChange={(event) => setOutAmount(event.target.value)}
                      inputMode="decimal"
                      dir="ltr"
                      placeholder={lang === "ar" ? "المبلغ" : "Amount"}
                      className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-black/[0.06] [direction:ltr]"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          pushOutflow();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={pushOutflow}
                      aria-label={lang === "ar" ? "إضافة بند" : "Add line"}
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#112A46] text-white shadow-sm"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                  </div>
                  <input value={outNote} onChange={(event) => setOutNote(event.target.value)} placeholder={lang === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-black/[0.06]" />
                  <div className="space-y-2">
                    {outflows.map((row) => (
                      <div key={row.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-black/[0.05]">
                        <span className="text-xs font-bold">{row.typeLabel || row.type}{row.category ? ` · ${row.category}` : ""}</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black tabular-nums text-[#B44747]">{money(row.amount, lang)}</strong>
                          <button type="button" onClick={() => removeOutflow(row.id)} className="text-[#B44747]">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </EntrySection>
                <EntrySection number={4} title={titles.photos} lang={lang}>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9B896] bg-white px-4 py-8 text-center">
                    <span className="text-xs font-bold text-[#827762]">{lang === "ar" ? "رفع صورة أو أكثر" : "Upload one or more photos"}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {attachments.filter(Boolean).map((src, index) => (
                      <div key={`thumb-${index}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <button type="button" onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))} className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#B44747] text-taq-meta text-white">×</button>
                      </div>
                    ))}
                  </div>
                </EntrySection>
                <EntrySection number={5} title={titles.review} lang={lang}>
                  <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-black/[0.05]">
                    <div className="flex justify-between text-sm font-bold"><span>{lang === "ar" ? "إجمالي الداخل" : "Total in"}</span><span className="tabular-nums">{money(totals.totalSales, lang)} ر.س</span></div>
                    <div className="flex justify-between text-sm font-bold text-[#B44747]"><span>{lang === "ar" ? "إجمالي الخارج" : "Total out"}</span><span className="tabular-nums">{money(totals.totalOutflow, lang)} ر.س</span></div>
                    <div className="flex justify-between text-base font-black text-[#257844]"><span>{lang === "ar" ? "الناتج" : "Net"}</span><span className="tabular-nums">{money(totals.netMovement, lang)} ر.س</span></div>
                  </div>
                </EntrySection>
              </>
            )}
          </div>
        </NotebookScrollSurface>
      </div>
      <div className="shrink-0 border-t border-[#ECE6DA]/80 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {phase === "date" ? (
          <button type="button" onClick={continueToForm} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">
            {lang === "ar" ? "التالي" : "Next"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={saveDraft} disabled={saving} className="rounded-2xl bg-[#F7F5EF] py-3.5 text-xs font-black disabled:opacity-50">
              {lang === "ar" ? "حفظ" : "Save"}
            </button>
            <button type="button" disabled={saving || totals.totalSales <= 0} onClick={handleSubmit} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white disabled:opacity-50">
              {lang === "ar" ? "إرسال" : "Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

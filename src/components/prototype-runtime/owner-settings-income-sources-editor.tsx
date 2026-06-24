"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  listInactiveIncomeSourceRows,
  listUnifiedIncomeSourceRows,
} from "@/features/org-config/client/owner-settings-channel-actions";
import { SettingToggle } from "./owner-settings-ui-primitives";
import type { OwnerSettingsIncomeSourcesEditorProps } from "./prototype-runtime-types";

export function OwnerSettingsIncomeSourcesEditor({
  lang,
  channelConfig,
  newCustomIncomeSourceName,
  setNewCustomIncomeSourceName,
  toggleChannel,
  restoreSalesChannel,
  deleteCustomIncomeSource,
  addCustomIncomeSource,
  text,
  channelName,
}: OwnerSettingsIncomeSourcesEditorProps) {
  const rows = listUnifiedIncomeSourceRows(channelConfig);
  const inactiveIncomeSources = useMemo(() => listInactiveIncomeSourceRows(channelConfig), [channelConfig]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customNameEn, setCustomNameEn] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const paymentAddedNotice = lang === "ar"
    ? "تمت إضافة طريقة الدفع. اضغط حفظ لتثبيت التغيير."
    : "Payment method added. Save to apply the change.";
  const paymentDisabledNotice = lang === "ar"
    ? "تم تعطيل طريقة الدفع. ستظهر داخل زر الإضافة، اضغط حفظ لتثبيت التغيير."
    : "Payment method disabled. It will appear in Add; save to apply the change.";
  const paymentEnabledNotice = lang === "ar"
    ? "تم تفعيل طريقة الدفع. اضغط حفظ لتثبيت التغيير."
    : "Payment method enabled. Save to apply the change.";
  const paymentDeletedNotice = lang === "ar"
    ? "تم حذف طريقة الدفع من القائمة. اضغط حفظ لتثبيت التغيير."
    : "Payment method removed from the list. Save to apply the change.";

  const restoreIncomeSource = (row: (typeof inactiveIncomeSources)[number]) => {
    if (row.channel?.retired) {
      restoreSalesChannel(row.channel);
    } else {
      toggleChannel(String(row.channel?.id || row.legacyId || row.rowId));
    }
    setActionNotice(paymentAddedNotice);
    setShowAddMenu(false);
  };

  const deleteInactiveCustom = (row: (typeof inactiveIncomeSources)[number]) => {
    if (!row.channel || !row.canDelete) return;
    deleteCustomIncomeSource(row.channel);
    setActionNotice(paymentDeletedNotice);
  };

  const addCustom = () => {
    addCustomIncomeSource({
      nameAr: newCustomIncomeSourceName,
      nameEn: customNameEn,
    });
    setActionNotice(paymentAddedNotice);
    setCustomNameEn("");
    setShowAddMenu(false);
  };

  const toggleActiveRow = (row: (typeof rows)[number]) => {
    const isLastActive = row.isActive && channelConfig.activeIds.length <= 1;
    toggleChannel(row.toggleId);
    if (isLastActive) return;
    setActionNotice(row.isActive ? paymentDisabledNotice : paymentEnabledNotice);
  };

  return (
    <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-taq-meta font-bold text-[#827762]">
          {lang === "ar" ? "لا توجد طرق دفع مفعلة." : "No active payment methods."}
        </p>
      ) : (
        rows.map((row, index) => (
          <div
            key={row.rowId}
            className={`flex items-center justify-between gap-3 bg-white px-4 py-4 ${index < rows.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}
          >
            <div className="min-w-0">
              <p className="text-xs font-black">{channelName(row.channel, lang)}</p>
              <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                {row.isActive ? text(lang, "active") : text(lang, "stopChannel")}
              </p>
            </div>
            <SettingToggle
              enabled={row.isActive}
              onToggle={() => toggleActiveRow(row)}
            />
          </div>
        ))
      )}

      <div className="border-t border-[#F0ECE2] bg-white px-4 py-4">
        <button
          type="button"
          onClick={() => setShowAddMenu((current) => !current)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white"
        >
          {showAddMenu ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {lang === "ar" ? "إضافة طريقة دفع" : "Add payment method"}
        </button>

        {showAddMenu ? (
          <div className="mt-4 rounded-2xl bg-[#F7F5EF] p-3">
            {inactiveIncomeSources.length ? (
              <div className="mb-4 grid gap-2">
                {inactiveIncomeSources.map((row) => (
                  <div key={row.rowId} className="flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-black/[0.04]">
                    <button
                      type="button"
                      onClick={() => restoreIncomeSource(row)}
                      className="min-w-0 flex-1 rounded-lg px-2 py-2 text-taq-meta font-black text-[#112A46]"
                    >
                      {lang === "ar" ? row.nameAr : row.nameEn}
                    </button>
                    {row.canDelete ? (
                      <button
                        type="button"
                        onClick={() => deleteInactiveCustom(row)}
                        className="rounded-lg bg-[#FFF1EE] px-2 py-2 text-[10px] font-black text-[#B44747]"
                      >
                        {lang === "ar" ? "حذف نهائي" : "Delete"}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mb-2 text-taq-meta font-black text-[#827762]">
              {lang === "ar" ? "إضافة طريقة دفع مخصصة" : "Add a custom payment method"}
            </p>
            <div className="grid gap-2">
              <input
                value={newCustomIncomeSourceName}
                onChange={(event) => setNewCustomIncomeSourceName(event.target.value)}
                placeholder={lang === "ar" ? "الاسم بالعربي" : "Arabic name"}
                className="w-full rounded-2xl bg-white px-3 py-3 text-xs font-bold outline-none ring-1 ring-black/[0.04]"
              />
              <input
                value={customNameEn}
                onChange={(event) => setCustomNameEn(event.target.value)}
                placeholder={lang === "ar" ? "الاسم بالإنجليزي" : "English name"}
                className="w-full rounded-2xl bg-white px-3 py-3 text-xs font-bold outline-none ring-1 ring-black/[0.04]"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!newCustomIncomeSourceName.trim() && !customNameEn.trim()}
                className="rounded-2xl bg-[#E4B84A] py-3 text-xs font-black text-[#112A46] disabled:opacity-50"
              >
                {lang === "ar" ? "إضافة" : "Add"}
              </button>
            </div>
          </div>
        ) : null}

        {actionNotice ? (
          <p className="mt-3 rounded-2xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">
            {actionNotice}
          </p>
        ) : null}
      </div>
    </div>
  );
}

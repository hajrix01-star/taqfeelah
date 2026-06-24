"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  findConfiguredChannelByLegacyId,
  listInactiveCatalogSources,
  listUnifiedIncomeSourceRows,
} from "@/features/org-config/client/owner-settings-channel-actions";
import { SettingToggle } from "./owner-settings-ui-primitives";
import type { OwnerSettingsIncomeSourcesEditorProps } from "./prototype-runtime-types";

export function OwnerSettingsIncomeSourcesEditor({
  lang,
  channelConfig,
  retiredChannels,
  newCustomIncomeSourceName,
  setNewCustomIncomeSourceName,
  toggleChannel,
  restoreSalesChannel,
  addCustomIncomeSource,
  text,
  channelName,
}: OwnerSettingsIncomeSourcesEditorProps) {
  const rows = listUnifiedIncomeSourceRows(channelConfig);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customNameEn, setCustomNameEn] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const inactiveCatalogSources = useMemo(() => listInactiveCatalogSources(channelConfig), [channelConfig]);
  const retiredByLegacyId = useMemo(() => new Map<string, Record<string, unknown>>(
    retiredChannels.map((channel): [string, Record<string, unknown>] => [
      String(
        channel.legacyId
        || channel.text
        || (typeof channel.id === "string" && !channel.id.includes("-") ? channel.id : ""),
      ),
      channel as Record<string, unknown>,
    ]).filter(([legacyId]) => Boolean(legacyId)),
  ), [retiredChannels]);

  const addCatalogSource = (legacyId: string) => {
    const retired = retiredByLegacyId.get(legacyId);
    if (retired) {
      restoreSalesChannel(retired);
    } else {
      const configured = findConfiguredChannelByLegacyId(channelConfig, legacyId);
      toggleChannel(String(configured?.id || legacyId));
    }
    setActionNotice(lang === "ar" ? "تمت إضافة طريقة الدفع. اضغط حفظ لتثبيت التغيير." : "Payment method added. Save to apply the change.");
    setShowAddMenu(false);
  };

  const addCustom = () => {
    addCustomIncomeSource({
      nameAr: newCustomIncomeSourceName,
      nameEn: customNameEn,
    });
    setActionNotice(lang === "ar" ? "تمت إضافة طريقة الدفع. اضغط حفظ لتثبيت التغيير." : "Payment method added. Save to apply the change.");
    setCustomNameEn("");
    setShowAddMenu(false);
  };

  const toggleActiveRow = (row: (typeof rows)[number]) => {
    const isLastActive = row.isActive && channelConfig.activeIds.length <= 1;
    toggleChannel(row.toggleId);
    if (isLastActive) return;
    setActionNotice(
      row.isActive
        ? (lang === "ar" ? "تم تعطيل طريقة الدفع. ستظهر داخل زر الإضافة، اضغط حفظ لتثبيت التغيير." : "Payment method disabled. It will appear in Add; save to apply the change.")
        : (lang === "ar" ? "تم تفعيل طريقة الدفع. اضغط حفظ لتثبيت التغيير." : "Payment method enabled. Save to apply the change."),
    );
  };

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-taq-meta font-bold text-[#827762]">
            {lang === "ar" ? "لا توجد بنود." : "No items."}
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
              <div className="flex items-center gap-2">
                <SettingToggle
                  enabled={row.isActive}
                  onToggle={() => toggleActiveRow(row)}
                />
              </div>
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
              {inactiveCatalogSources.length ? (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {inactiveCatalogSources.map((entry) => (
                    <button
                      key={entry.legacyId}
                      type="button"
                      onClick={() => addCatalogSource(entry.legacyId)}
                      className="rounded-xl bg-white px-3 py-3 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.04]"
                    >
                      {lang === "ar" ? entry.nameAr : entry.nameEn}
                    </button>
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
    </>
  );
}

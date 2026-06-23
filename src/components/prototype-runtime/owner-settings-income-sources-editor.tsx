"use client";

import { Plus } from "lucide-react";
import { listUnifiedIncomeSourceRows } from "@/features/org-config/client/owner-settings-channel-actions";
import { SettingToggle } from "./owner-settings-ui-primitives";
import type { OwnerSettingsIncomeSourcesEditorProps } from "./prototype-runtime-types";

export function OwnerSettingsIncomeSourcesEditor({
  lang,
  channelConfig,
  newCustomIncomeSourceName,
  setNewCustomIncomeSourceName,
  toggleChannel,
  addCustomIncomeSource,
  text,
  channelName,
}: OwnerSettingsIncomeSourcesEditorProps) {
  const rows = listUnifiedIncomeSourceRows(channelConfig);
  const resolveCreatorHint = (channel: Record<string, unknown>, isCatalog: boolean) => {
    if (isCatalog) return "";
    const createdByName = typeof channel.createdByName === "string"
      ? channel.createdByName.trim()
      : "";
    if (createdByName) {
      return lang === "ar" ? `بواسطة ${createdByName}` : `By ${createdByName}`;
    }
    return lang === "ar" ? "بواسطة العميل" : "By customer";
  };

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-taq-meta font-bold text-[#827762]">
            {lang === "ar" ? "لا توجد بنود." : "No items."}
          </p>
        ) : (
          rows.map((row, index) => {
            const creatorHint = resolveCreatorHint(row.channel, row.isCatalog);
            return (
            <div
              key={row.rowId}
              className={`flex items-center justify-between gap-3 bg-white px-4 py-4 ${index < rows.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-xs font-black">{channelName(row.channel, lang)}</p>
                <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                  {row.isActive ? text(lang, "active") : text(lang, "stopChannel")}
                </p>
                {creatorHint ? (
                  <p className="mt-1 text-[11px] font-semibold text-[#A79D8E]">
                    {creatorHint}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <SettingToggle
                  enabled={row.isActive}
                  onToggle={() => toggleChannel(row.toggleId)}
                />
              </div>
            </div>
            );
          })
        )}

        <div className="border-t border-[#F0ECE2] bg-white px-4 py-4">
          <p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "addIncomeSource")}</p>
          <div className="flex gap-2">
            <input
              value={newCustomIncomeSourceName}
              onChange={(event) => setNewCustomIncomeSourceName(event.target.value)}
              placeholder={text(lang, "customIncomeSourceName")}
              className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none"
            />
            <button
              type="button"
              onClick={addCustomIncomeSource}
              className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    </>
  );
}

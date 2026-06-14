"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  listAddableCatalogSources,
  listVisibleChannelsByKind,
} from "@/features/org-config/client/owner-settings-channel-actions";
import { catalogDisplayName } from "@/core/client/income-source-catalog";
import { SettingToggle } from "./owner-settings-ui-primitives";

function CatalogPicker({ lang, kind, channelConfig, onAddCatalogChannel }) {
  const addable = listAddableCatalogSources(channelConfig, kind);
  if (addable.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {addable.map((entry) => (
        <button
          key={entry.legacyId}
          type="button"
          onClick={() => onAddCatalogChannel(entry.legacyId)}
          className="rounded-full bg-white px-3 py-2 text-taq-meta font-black text-[#112A46] ring-1 ring-[#E8E1D4]"
        >
          + {catalogDisplayName(entry.legacyId, lang)}
        </button>
      ))}
    </div>
  );
}

function ChannelRows({
  lang,
  channels,
  channelConfig,
  channelName,
  text,
  toggleChannel,
  requestRetireChannel,
}) {
  if (channels.length === 0) {
    return (
      <p className="px-4 py-4 text-taq-meta font-bold text-[#827762]">
        {lang === "ar" ? "لا توجد بنود مفعّلة." : "No active items."}
      </p>
    );
  }

  return channels.map((channel, index) => (
    <div
      key={channel.id}
      className={`flex items-center justify-between gap-3 bg-white px-4 py-4 ${index < channels.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-black">{channelName(channel, lang)}</p>
        <p className="mt-1 text-taq-meta font-bold text-[#827762]">
          {channelConfig.activeIds.includes(channel.id) ? text(lang, "active") : text(lang, "stopChannel")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SettingToggle
          enabled={channelConfig.activeIds.includes(channel.id)}
          onToggle={() => toggleChannel(channel.id)}
        />
        <button
          type="button"
          onClick={() => requestRetireChannel(channel)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  ));
}

export function OwnerSettingsIncomeSourcesEditor({
  lang,
  visibleChannels,
  channelConfig,
  retiredChannels,
  newPaymentMethodName,
  setNewPaymentMethodName,
  newSalesChannelName,
  setNewSalesChannelName,
  toggleChannel,
  requestRetireChannel,
  restoreSalesChannel,
  addCustomPaymentMethod,
  addCustomSalesChannel,
  addCatalogChannel,
  text,
  channelName,
}) {
  const paymentMethods = listVisibleChannelsByKind(channelConfig, visibleChannels, "payment_method");
  const salesChannels = listVisibleChannelsByKind(channelConfig, visibleChannels, "sales_channel");

  return (
    <>
      <p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
        {text(lang, "channelControlHint")}
      </p>

      <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
        <div className="border-b border-[#F0ECE2] bg-[#FAF7EF] px-4 py-3">
          <p className="text-xs font-black text-[#112A46]">{text(lang, "paymentMethods")}</p>
        </div>
        <ChannelRows
          lang={lang}
          channels={paymentMethods}
          channelConfig={channelConfig}
          channelName={channelName}
          text={text}
          toggleChannel={toggleChannel}
          requestRetireChannel={requestRetireChannel}
        />
        <div className="border-t border-[#F0ECE2] bg-white px-4 py-4">
          <p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "addPaymentMethod")}</p>
          <CatalogPicker
            lang={lang}
            kind="payment_method"
            channelConfig={channelConfig}
            onAddCatalogChannel={addCatalogChannel}
          />
          <div className="mt-3 flex gap-2">
            <input
              value={newPaymentMethodName}
              onChange={(event) => setNewPaymentMethodName(event.target.value)}
              placeholder={text(lang, "customPaymentMethodName")}
              className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none"
            />
            <button
              type="button"
              onClick={addCustomPaymentMethod}
              className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
        <div className="border-b border-[#F0ECE2] bg-[#FAF7EF] px-4 py-3">
          <p className="text-xs font-black text-[#112A46]">{text(lang, "salesChannelsTitle")}</p>
        </div>
        <ChannelRows
          lang={lang}
          channels={salesChannels}
          channelConfig={channelConfig}
          channelName={channelName}
          text={text}
          toggleChannel={toggleChannel}
          requestRetireChannel={requestRetireChannel}
        />
        <div className="border-t border-[#F0ECE2] bg-white px-4 py-4">
          <p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "addSalesChannel")}</p>
          <CatalogPicker
            lang={lang}
            kind="sales_channel"
            channelConfig={channelConfig}
            onAddCatalogChannel={addCatalogChannel}
          />
          <div className="mt-3 flex gap-2">
            <input
              value={newSalesChannelName}
              onChange={(event) => setNewSalesChannelName(event.target.value)}
              placeholder={text(lang, "customSalesChannelName")}
              className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none"
            />
            <button
              type="button"
              onClick={addCustomSalesChannel}
              className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {retiredChannels.length > 0 && (
        <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "stoppedChannels")}</p>
          {retiredChannels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => restoreSalesChannel(channel)}
              className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#F7F5EF] px-3 py-3 text-taq-meta font-black text-[#257844]"
            >
              <span>{channelName(channel, lang)}</span>
              <span>{text(lang, "restoreChannel")}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

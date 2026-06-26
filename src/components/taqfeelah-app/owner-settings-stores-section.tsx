"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { canAddStore, resolveStoreLimitMessage } from "@/features/billing/client/entitlement-guards";
import { text } from "./taqfeelah-app-reference-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import { SettingsPageHeader } from "./owner-settings-ui-primitives";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type {
  OwnerSettingsDeleteDialogProps,
  OwnerSettingsSectionCommonProps,
  AppBusiness,
} from "./taqfeelah-app-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

export function OwnerSettingsStoresSection({
  lang,
  showAddStore,
  setShowAddStore,
  newStoreName,
  setNewStoreName,
  newStoreLocation,
  setNewStoreLocation,
  addStore,
  activeStoredBusinesses,
  archivedStoredBusinesses,
  showArchivedStores,
  setShowArchivedStores,
  displayBusinessName,
  displayLocation,
  openStore,
  setSection,
  deleteDialogProps,
  orgConfigLoading = false,
  storeSaving = false,
  settingsNotice = "",
  settingsSuccess = false,
  entitlements = null,
  embedded = false,
  countEmployeesForStore = null,
}: OwnerSettingsSectionCommonProps & {
  showAddStore: boolean;
  setShowAddStore: (value: boolean) => void;
  newStoreName: string;
  setNewStoreName: (value: string) => void;
  newStoreLocation: string;
  setNewStoreLocation: (value: string) => void;
  addStore: () => void | Promise<void>;
  activeStoredBusinesses: AppBusiness[];
  archivedStoredBusinesses: AppBusiness[];
  showArchivedStores: boolean;
  setShowArchivedStores: (value: boolean) => void;
  displayBusinessName: (business: AppBusiness) => string;
  displayLocation: (business: AppBusiness) => string;
  openStore: (storeId: string) => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  orgConfigLoading?: boolean;
  storeSaving?: boolean;
  settingsNotice?: string;
  settingsSuccess?: boolean;
  entitlements?: ResolvedOrganizationEntitlements | null;
  countEmployeesForStore?: ((storeId: string) => number) | null;
}) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const atStoreLimit = entitlements ? !canAddStore(entitlements) : false;
  const storeLimitMessage = atStoreLimit ? resolveStoreLimitMessage(entitlements, lang) : "";
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      {orgConfigLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جارٍ تحميل المحلات من السيرفر..." : "Loading stores from server..."}
        </div>
      ) : (
        <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p>
        <button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button>
      </div>
      {showAddStore && (
        <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          {atStoreLimit ? (
            <p className="mb-4 rounded-2xl bg-[#FFF1EE] p-3 text-center text-taq-meta font-bold leading-6 text-[#B44747]">
              {storeLimitMessage}
            </p>
          ) : null}
          <input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} disabled={atStoreLimit} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none disabled:opacity-60" />
          <input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} disabled={atStoreLimit} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none disabled:opacity-60" />
          <button type="button" onClick={() => { void addStore(); }} disabled={storeSaving || atStoreLimit} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white disabled:opacity-60">
            {storeSaving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : text(lang, "confirmAddStore")}
          </button>
        </div>
      )}
      {(settingsNotice || settingsSuccess) ? (
        <div className="mb-4">
          {settingsNotice ? (
            <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>
          ) : null}
          {settingsSuccess ? (
            <div className="mt-2 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>
          ) : null}
        </div>
      ) : null}
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => (
          <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <div>
              <p className="text-xs font-black">{displayBusinessName(business)}</p>
              <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                {displayLocation(business)}{" "}
                <span className="text-[#257844]">{text(lang, "storeActive")}</span>
                {typeof countEmployeesForStore === "function" ? (
                  <span className="text-[#716753]">
                    {" · "}
                    {countEmployeesForStore(business.id)}
                    {lang === "ar" ? " موظف" : " staff"}
                  </span>
                ) : null}
              </p>
            </div>
            <Arrow className="h-4 w-4 text-[#B99844]" />
          </button>
        )) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}
      </div>
      {archivedStoredBusinesses.length > 0 && (
        <>
          <button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-taq-meta font-black text-[#9A823E]">
            {text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})
            <ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} />
          </button>
          {showArchivedStores && (
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
              {archivedStoredBusinesses.map((business) => (
                <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70">
                  <div>
                    <p className="text-xs font-black">{displayBusinessName(business)}</p>
                    <p className="mt-1 text-taq-meta font-bold text-[#B96725]">{text(lang, "archivedStore")}</p>
                  </div>
                  <Arrow className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
        </>
      )}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </SettingsSectionFrame>
  );
}

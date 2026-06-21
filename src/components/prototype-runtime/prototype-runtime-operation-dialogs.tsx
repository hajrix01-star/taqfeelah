"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Plus, ReceiptText, Send, X } from "lucide-react";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import AttachmentLightbox from "../AttachmentLightbox";
import {
  AttachmentPreview,
  useAttachmentSource,
} from "./prototype-runtime-attachment-ui";
import {
  businesses,
  businessName,
  text,
  money,
  opDate,
  opTime,
  auditDateTime,
} from "./prototype-runtime-demo-data";
import {
  noteLabel,
  operationDisplayLabel,
  signedEntryAmount,
  entryWasRestored,
  entryHasAttachment,
  entryIsVoided,
} from "./prototype-runtime-entry-helpers";
import CloseoutOwnerEditBadge from "@/features/closeouts/client/CloseoutOwnerEditBadge";
import { Badge } from "./prototype-runtime-shell-ui";
import type {
  OperationalEntry,
  PrototypeBusiness,
  PrototypeLang,
  PrototypeOperationalEntry,
} from "./prototype-runtime-types";

export function SavedOutflowShareDialog({ lang, item, businessesList = businesses, onClose }: {
  lang: PrototypeLang;
  item: OperationalEntry | null;
  businessesList?: PrototypeBusiness[];
  onClose: () => void;
}) {
  if (!item) return null;
  const store = businessesList.find((business) => business.id === item.businessId);
  const categoryLabel = operationDisplayLabel(item, lang);
  const message = `${text(lang, "addOutflow")} - ${businessName(store, lang)}
${text(lang, "transactionType")}: ${text(lang, item.type || "summary")}
${text(lang, "category")}: ${categoryLabel}
${text(lang, "amount")}: ${money(signedEntryAmount(item), lang)}
${text(lang, "date")}: ${formatCalendarDate(item.date || "", lang)}
${text(lang, "note")}: ${item.note || "-"}`;
  const sendWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank"); onClose(); };
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "outflowSavedTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "outflowSavedDesc")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-black text-[#112A46]">{categoryLabel}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{businessName(store, lang)} {formatCalendarDate(item.date || "", lang)}</p></div><strong className="tabular-nums text-sm font-black text-[#B44747]">{money(signedEntryAmount(item), lang)}</strong></div></div><p className="mt-4 text-xs font-bold text-[#716753]">{text(lang, "sendOutflowQuestion")}</p><div className="mt-5 grid grid-cols-[1fr_1.15fr] gap-3"><button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "keepWithoutSending")}</button><button onClick={sendWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white"><Send className="h-4 w-4" />{text(lang, "saveShareWhatsApp")}</button></div></motion.div></motion.div></AnimatePresence>;
}

export function OperationModal({
  lang,
  item,
  onClose,
  onVoid,
  onRestore,
  onEditOwnerCloseout,
  ownerEditSource = null,
  canVoid = true,
  canRestore = true,
  entryAttachmentsApiEnabled = false,
  entryAttachmentsApiOrganizationId = "",
  entryAttachmentsApiActorUserId = "",
  entryAttachmentsApiActorRole = "owner",
}: {
  lang: PrototypeLang;
  item: OperationalEntry | null;
  onClose: () => void;
  onVoid?: (entryId: string) => void;
  onRestore?: (entryId: string) => void;
  onEditOwnerCloseout?: (entry: OperationalEntry) => void;
  ownerEditSource?: Record<string, unknown> | null;
  canVoid?: boolean;
  canRestore?: boolean;
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
}) {
  const attachmentSource = useAttachmentSource(item?.attachment, {
    storeId: item?.businessId,
    attachmentsApiEnabled: entryAttachmentsApiEnabled,
    organizationId: entryAttachmentsApiOrganizationId,
    actorUserId: entryAttachmentsApiActorUserId,
    actorRole: entryAttachmentsApiActorRole,
  });
  const [attachmentOpen, setAttachmentOpen] = useState(false);

  useEffect(() => {
    setAttachmentOpen(false);
  }, [item?.id]);

  if (!item) return null;
  const itemWithCloseoutEdit = item as PrototypeOperationalEntry;
  const isSale = item.type === "summary";
  const voided = entryIsVoided(item);
  const auditTrail = item.auditTrail || [];

  return (
    <>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-end bg-[#112A46]/35 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0"
            aria-label={text(lang, "close")}
          />
          <motion.div
            initial={{ y: 18 }}
            animate={{ y: 0 }}
            exit={{ y: 18 }}
            className="relative z-10 flex max-h-[min(92dvh,100%)] w-full max-w-full flex-col overflow-hidden rounded-t-[30px] bg-[#F8F6F0] sm:max-w-[560px] sm:rounded-[30px] lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#F0ECE2]/80 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge>
                  {voided && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                  {!voided && entryWasRestored(item) && <Badge tone="success">{text(lang, "restored")}</Badge>}
                  <CloseoutOwnerEditBadge
                    lang={lang}
                    source={ownerEditSource || {
                      ownerEditedAt: item.closeoutOwnerEditedAt,
                      ownerEditedByUserId: itemWithCloseoutEdit.closeoutOwnerEditedByUserId,
                      ownerEditedByName: itemWithCloseoutEdit.closeoutOwnerEditedByName,
                    }}
                  />
                </div>
                <h3 className="mt-2 break-words text-lg font-black">{noteLabel(item, lang)}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"
                aria-label={text(lang, "close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <div className="mb-4 rounded-2xl bg-white p-4 text-sm">
              <div className="mb-2 flex justify-between gap-3"><span className="shrink-0">{text(lang, "amount")}</span><strong className={`text-end ${voided ? "line-through opacity-60" : ""} ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div>
              <div className="mb-2 flex justify-between gap-3"><span className="shrink-0">{text(lang, "time")}</span><strong className="text-end">{opDate(item, lang)} {opTime(item, lang)}</strong></div>
              <div className="flex justify-between gap-3"><span className="shrink-0">{text(lang, "enteredBy")}</span><strong className="min-w-0 break-words text-end">{employeeDisplayName(item, lang)}</strong></div>
              {voided && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#B44747]"><span>{text(lang, "status")}</span><strong>{text(lang, "voidedByOwner")}</strong></div>
                  {item.voidReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "voidReason")}</span><strong className="text-end">{item.voidReason}</strong></div>}
                </div>
              )}
              {!voided && entryWasRestored(item) && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#257844]"><span>{text(lang, "status")}</span><strong>{text(lang, "restoredByOwner")}</strong></div>
                  {item.restoreReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "restoreReason")}</span><strong className="text-end">{item.restoreReason}</strong></div>}
                </div>
              )}
            </div>

            {auditTrail.filter((action) => action.action !== "reviewed").length > 0 && (
              <div className="mb-4 rounded-2xl bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#112A46]">{text(lang, "auditTrail")}</p>
                <div className="space-y-2">
                  {auditTrail.filter((action) => action.action !== "reviewed").map((action, index) => {
                    const actor = action.by as OperationalEntry["enteredBy"] | undefined;
                    const actionAt = typeof action.at === "string" ? action.at : "";
                    const actionReason = typeof action.reason === "string" ? action.reason : "";
                    return (
                    <div key={`${String(action.action)}-${actionAt}-${index}`} className="flex items-start justify-between gap-3 text-taq-meta font-bold">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${action.action === "voided" ? "bg-[#B44747]" : action.action === "restored" || action.action === "reviewed" || action.action === "duplicate_approved" ? "bg-[#257844]" : "bg-[#806528]"}`} />
                        <div className="min-w-0">
                          <p className="break-words">{text(lang, action.action === "created" ? "actionCreated" : action.action === "voided" ? "actionVoided" : action.action === "restored" ? "actionRestored" : action.action === "reviewed" ? "actionReviewed" : "actionDuplicateApproved")}</p>
                          <p className="mt-0.5 break-words font-medium text-[#827762]">{actor ? (lang === "ar" ? actor.nameAr : actor.nameEn) : "-"}</p>
                          {actionReason ? <p className="mt-0.5 break-words font-medium text-[#827762]">{actionReason}</p> : null}
                        </div>
                      </div>
                      <span className="max-w-[42%] shrink-0 text-end text-[#827762]">{auditDateTime(actionAt, lang)}</span>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {entryHasAttachment(item) && (
              <div className="mb-4 overflow-hidden rounded-2xl bg-[#E9E2D5]">
                <button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (attachmentSource) setAttachmentOpen(true);
                  }}
                >
                  <AttachmentPreview
                    attachment={item.attachment}
                    className="h-52 w-full"
                    attachmentApiContext={{
                      storeId: item.businessId,
                      attachmentsApiEnabled: entryAttachmentsApiEnabled,
                      organizationId: entryAttachmentsApiOrganizationId,
                      actorUserId: entryAttachmentsApiActorUserId,
                      actorRole: entryAttachmentsApiActorRole,
                    }}
                  />
                </button>
                <p className="border-t border-[#D9CEBA] px-3 py-2 text-center text-taq-meta font-bold text-[#716753]">
                  {text(lang, "openAttachment")}
                </p>
              </div>
            )}

            {onEditOwnerCloseout && item.closeoutId && !voided && (
              <button
                type="button"
                onClick={() => onEditOwnerCloseout(item)}
                className="mb-3 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-extrabold text-white"
              >
                {text(lang, "editOwnerCloseout")}
              </button>
            )}
            {canRestore && voided && onRestore && <button onClick={() => onRestore(String(item.id || ""))} className="w-full rounded-2xl bg-[#E6F5E9] py-4 text-sm font-extrabold text-[#257844]">{text(lang, "restoreEntry")}</button>}
            {canVoid && !voided && onVoid && <button onClick={() => onVoid(String(item.id || ""))} className="w-full rounded-2xl bg-[#FFF1EE] py-4 text-sm font-extrabold text-[#B44747]">{text(lang, "voidEntry")}</button>}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <AttachmentLightbox
        open={attachmentOpen}
        src={attachmentSource?.source ?? null}
        lang={lang}
        onClose={() => setAttachmentOpen(false)}
      />
    </>
  );
}

export function DuplicateSalesDialog({ lang, draft, previousEntries = [], businessesList = businesses, onCancel, onConfirm }: {
  lang: PrototypeLang;
  draft: import("@/features/entries/client/entries-client-types").OperationalEntryPayload | null;
  previousEntries?: OperationalEntry[];
  businessesList?: PrototypeBusiness[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!draft) return null;
  const store = businessesList.find((business) => business.id === draft.businessId);
  const newAmount = (draft.salesChannels || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const previousTotal = previousEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Bell className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "duplicateSalesTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "duplicateSalesWarning")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-taq-meta font-black text-[#112A46]">{businessName(store, lang)} {formatCalendarDate(draft.date || "", lang)}</p><div className="mt-3 flex justify-between text-xs font-bold text-[#827762]"><span>{text(lang, "previousSalesEntries")} ({previousEntries.length})</span><strong>{money(previousTotal, lang)}</strong></div><div className="mt-2 flex justify-between border-t border-[#F0ECE2] pt-2 text-xs font-black"><span>{text(lang, "summary")}</span><strong className="text-[#257844]">+{money(newAmount, lang)}</strong></div></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={onConfirm} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "saveAdditionalEntry")}</button></div></motion.div></motion.div></AnimatePresence>;
}

export function VoidOperationDialog({ lang, item, onCancel, onConfirm }: {
  lang: PrototypeLang;
  item: OperationalEntry | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><X className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "voidDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "voidConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "voidReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "voidReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "confirmVoid")}</button></div></motion.div></motion.div></AnimatePresence>;
}

export function RestoreOperationDialog({ lang, item, onCancel, onConfirm }: {
  lang: PrototypeLang;
  item: OperationalEntry | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "restoreDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "restoreConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "restoreReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "restoreReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white">{text(lang, "confirmRestore")}</button></div></motion.div></motion.div></AnimatePresence>;
}

export function QuickAddSheet({ lang, employee, open, onClose, onSummary, onExpense }: {
  lang: PrototypeLang;
  employee: boolean;
  open: boolean;
  onClose: () => void;
  onSummary: () => void;
  onExpense: () => void;
}) {
  if (!open) return null;
  const secondaryTitle = employee ? text(lang, "addPurchaseExpense") : text(lang, "addPaidByOwner");
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
        <button onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "addOutflow")}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "إضافة عملية" : "Add entry"}</h3>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onSummary} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{employee ? text(lang, "enterDailySummary") : text(lang, "enterOwnerSummary")}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
            </button>
            <button onClick={onExpense} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] ring-1 ring-black/[0.055]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{secondaryTitle}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

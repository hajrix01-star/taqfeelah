"use client";

import { businesses, businessName, money, opTime, text } from "./taqfeelah-app-demo-data";
import { AttachmentThumbButton } from "./taqfeelah-app-attachment-ui";
import { signedEntryAmount } from "./taqfeelah-app-entry-helpers";
import { MoneyValue, NotebookRow } from "./taqfeelah-app-notebook";
import type { OwnerHomeProps, PrototypeBusiness } from "./taqfeelah-app-types";

export function OwnerHomeDayAttachments({
  lang,
  group,
  businessesList = businesses,
  loading = false,
  loadFailed = false,
  proofsCount = 0,
  onOpenOperation = () => {},
  onPreviewAttachment = (_src: string, _shareContext?: Record<string, unknown> | null) => {},
  entryAttachmentsApiEnabled = false,
  entryAttachmentsApiOrganizationId = "",
  entryAttachmentsApiActorUserId = "",
  entryAttachmentsApiActorRole = "owner",
}: {
  lang: OwnerHomeProps["lang"];
  group: { items?: Array<Record<string, unknown>> } | null;
  businessesList?: PrototypeBusiness[];
  loading?: boolean;
  loadFailed?: boolean;
  proofsCount?: number;
  onOpenOperation?: (entry: import("./taqfeelah-app-types").OperationalEntry) => void;
  onPreviewAttachment?: (src: string, shareContext?: Record<string, unknown> | null) => void;
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
}) {
  if (loading) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">
          {lang === "ar" ? "جاري تحميل المرفقات…" : "Loading attachments…"}
        </p>
      </NotebookRow>
    );
  }
  if (!group?.items?.length) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">
          {loadFailed && proofsCount > 0
            ? (lang === "ar" ? "تعذر تحميل المرفقات من الخادم." : "Failed to load attachments from the server.")
            : text(lang, "noAttachmentsDay")}
        </p>
      </NotebookRow>
    );
  }
  return (
    <div className="py-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {group.items.map((item) => {
          const attachmentItem = item as {
            id?: string;
            businessId?: string;
            title?: string;
            titleEn?: string;
            attachment?: Record<string, unknown>;
            entry: import("./taqfeelah-app-types").OperationalEntry;
          };
          const store = businessesList.find((business) => business.id === attachmentItem.businessId);
          const storeLabel = businessName(store, lang, true) || businessName(store, lang);
          const operationLabel = lang === "ar" ? String(attachmentItem.title || "") : String(attachmentItem.titleEn || "");
          const shareContext = {
            entry: attachmentItem.entry,
            storeName: storeLabel,
            operationLabel,
            entryTime: opTime(attachmentItem.entry, lang),
            daySequence: attachmentItem.entry?.daySequence ?? null,
            sameDayCloseoutCount: 1,
          };
          return (
          <div key={String(attachmentItem.id)} className="min-w-[78px] text-center">
            <div className="mb-1 flex h-14 justify-center">
              <AttachmentThumbButton
                attachment={attachmentItem.attachment}
                lang={lang}
                onOpen={(src) => onPreviewAttachment(src, shareContext)}
                className="h-14 w-14 rounded-xl"
                attachmentApiContext={{
                  storeId: attachmentItem.businessId,
                  attachmentsApiEnabled: entryAttachmentsApiEnabled,
                  organizationId: entryAttachmentsApiOrganizationId,
                  actorUserId: entryAttachmentsApiActorUserId,
                  actorRole: entryAttachmentsApiActorRole,
                }}
              />
            </div>
            <button type="button" onClick={() => onOpenOperation(attachmentItem.entry)} className="w-full text-center">
              <p className="truncate text-taq-meta font-bold">{lang === "ar" ? attachmentItem.title : attachmentItem.titleEn}</p>
              <p className={`mt-0.5 text-taq-meta font-black ${attachmentItem.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}>
                <MoneyValue value={money(signedEntryAmount(attachmentItem.entry), lang)} />
              </p>
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { businessName, money, opTime, text } from "./prototype-runtime-demo-data";
import { MoneyValue } from "./prototype-runtime-notebook";
import { AttachmentThumbButton } from "./prototype-runtime-attachment-ui";
import { RegisterStoreBadge } from "./owner-register-ui-primitives";

function GalleryTile({
  item,
  lang,
  businessesList,
  showStoreBadge,
  entryAttachmentApiContext,
  onOpenOperation,
  onPreviewAttachment,
  daySequenceByCloseoutId,
  sameDayCloseoutCountByStoreDate,
}) {
  const store = businessesList.find((business) => business.id === item.businessId);
  const storeLabel = businessName(store, lang, true) || businessName(store, lang);
  const operationLabel = lang === "ar" ? item.label : item.labelEn;
  const registerDaySequence = item.entry?.closeoutId
    ? (Number.isInteger(item.entry.daySequence)
      ? item.entry.daySequence
      : daySequenceByCloseoutId.get(item.entry.closeoutId) ?? null)
    : null;
  const registerSameDayCloseoutCount = item.entry?.closeoutId
    ? sameDayCloseoutCountByStoreDate.get(`${item.businessId}|${item.date}`) || 1
    : 1;
  const shareContext = {
    entry: item.entry,
    storeName: storeLabel,
    operationLabel,
    entryTime: opTime(item.entry, lang),
    daySequence: registerDaySequence,
    sameDayCloseoutCount: registerSameDayCloseoutCount,
  };

  return (
    <article className="min-w-0">
      <div className="mb-1.5 flex justify-center">
        <AttachmentThumbButton
          attachment={item.attachment}
          storeId={item.businessId}
          lang={lang}
          attachmentApiContext={entryAttachmentApiContext}
          onOpen={(src) => onPreviewAttachment(src, shareContext)}
          className="aspect-square h-auto w-full rounded-xl"
          buttonClassName="w-full overflow-hidden rounded-xl ring-1 ring-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50 disabled:opacity-70"
        />
      </div>
      <button
        type="button"
        onClick={() => onOpenOperation(item.entry)}
        className="w-full text-center"
      >
        {showStoreBadge ? (
          <div className="mb-1 flex justify-center">
            <RegisterStoreBadge label={storeLabel} />
          </div>
        ) : null}
        <p className={`truncate text-[10px] font-bold leading-4 ${item.voided ? "text-[#A99D87] line-through" : "text-[#716753]"}`}>
          {operationLabel}
        </p>
        <p className={`mt-0.5 text-[10px] font-black tabular-nums ${item.voided ? "text-[#A99D87] line-through" : "text-[#B44747]"}`}>
          <MoneyValue value={money(-item.amount, lang)} />
        </p>
      </button>
    </article>
  );
}

function LazyGallerySection({ children, rootMargin = "320px" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (records) => {
        if (records.some((record) => record.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <section ref={ref} className="[content-visibility:auto] [contain-intrinsic-size:320px]">
      {visible ? children : <div className="h-40 rounded-[18px] bg-white/70 ring-1 ring-[#E8E1D4]/70" aria-hidden="true" />}
    </section>
  );
}

export function OwnerRegisterAttachmentsGallery({
  lang,
  sections = [],
  businessesList = [],
  showStoreBadge = false,
  entryAttachmentApiContext,
  daySequenceByCloseoutId,
  sameDayCloseoutCountByStoreDate,
  onOpenOperation = () => {},
  onPreviewAttachment = () => {},
  registerEntriesApiEnabled = false,
  apiRegisterEntriesHasMore = false,
  registerLoadMoreRef,
  loadError = false,
  loadErrorMessage = "",
  emptyMessage = "",
  loadingMore = false,
}) {
  if (loadError) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10">
        {loadErrorMessage}
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="space-y-3">
        <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">
          {registerEntriesApiEnabled && apiRegisterEntriesHasMore
            ? (lang === "ar" ? "جاري تحميل المرفقات…" : "Loading attachments…")
            : (emptyMessage || text(lang, "noOperationsMatch"))}
        </div>
        {registerEntriesApiEnabled && apiRegisterEntriesHasMore ? (
          <div ref={registerLoadMoreRef} className="flex justify-center py-1 text-[10px] font-bold text-[#827762]">
            {loadingMore
              ? (lang === "ar" ? "جاري تحميل المزيد…" : "Loading more…")
              : (lang === "ar" ? "جاري البحث في السجل…" : "Searching the log…")}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <LazyGallerySection key={section.id}>
          <div className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
            <div className="border-b border-[#F0EBE0] px-3.5 py-2.5">
              <p className="text-taq-meta font-black text-[#112A46]">{section.heading}</p>
            </div>
            <div className="space-y-4 px-3.5 py-3.5">
              {section.days.map((day) => (
                <div key={day.date}>
                  {section.days.length > 1 ? (
                    <p className="mb-2 text-[10px] font-black text-[#806528]">{day.dateLabel}</p>
                  ) : null}
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {day.items.map((item) => (
                      <GalleryTile
                        key={item.id}
                        item={item}
                        lang={lang}
                        businessesList={businessesList}
                        showStoreBadge={showStoreBadge}
                        entryAttachmentApiContext={entryAttachmentApiContext}
                        onOpenOperation={onOpenOperation}
                        onPreviewAttachment={onPreviewAttachment}
                        daySequenceByCloseoutId={daySequenceByCloseoutId}
                        sameDayCloseoutCountByStoreDate={sameDayCloseoutCountByStoreDate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LazyGallerySection>
      ))}
      {registerEntriesApiEnabled && apiRegisterEntriesHasMore ? (
        <div ref={registerLoadMoreRef} className="flex justify-center py-3 text-[10px] font-bold text-[#827762]">
          {loadingMore
            ? (lang === "ar" ? "جاري تحميل المزيد…" : "Loading more…")
            : (lang === "ar" ? "مرر لتحميل المزيد" : "Scroll to load more")}
        </div>
      ) : null}
    </div>
  );
}

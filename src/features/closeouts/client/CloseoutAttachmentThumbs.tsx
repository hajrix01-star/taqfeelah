"use client";

import { useState } from "react";
import AttachmentLightbox from "@/components/AttachmentLightbox";
import { useCloseoutAttachmentSrcs } from "./use-closeout-attachment-srcs";
import { isCloseoutAttachmentRef } from "./closeout-attachment-utils";

export default function CloseoutAttachmentThumbs({
  lang,
  closeoutId = "",
  storeId = "",
  attachments = [],
  thumbClassName = "h-14 w-14",
  enabled = true,
  attachmentsApiEnabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "employee",
}: {
  lang: "ar" | "en";
  closeoutId?: string;
  storeId?: string;
  attachments?: unknown;
  thumbClassName?: string;
  enabled?: boolean;
  attachmentsApiEnabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
}) {
  const [selectedAttachment, setSelectedAttachment] = useState("");
  const { normalized, resolveSrc, loading } = useCloseoutAttachmentSrcs({
    enabled,
    attachments,
    storeId,
    organizationId,
    actorUserId,
    actorRole,
    attachmentsApiEnabled,
  });

  if (!normalized.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {normalized.map((item, index) => {
          const key = isCloseoutAttachmentRef(item) ? item.id : `${closeoutId}-att-${index}`;
          const src = resolveSrc(item);
          return (
            <button
              key={key}
              type="button"
              className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50"
              disabled={!src}
              onClick={(event) => {
                event.stopPropagation();
                if (src) setSelectedAttachment(src);
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className={`${thumbClassName} rounded-xl object-cover ring-1 ring-black/[0.06]`} />
              ) : (
                <span className={`flex ${thumbClassName} items-center justify-center rounded-xl bg-[#F7F5EF] text-[10px] font-bold text-[#827762] ring-1 ring-black/[0.06]`}>
                  {loading
                    ? (lang === "ar" ? "…" : "…")
                    : (lang === "ar" ? "صورة" : "Img")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <AttachmentLightbox
        open={Boolean(selectedAttachment)}
        src={selectedAttachment}
        lang={lang}
        onClose={() => setSelectedAttachment("")}
      />
    </>
  );
}

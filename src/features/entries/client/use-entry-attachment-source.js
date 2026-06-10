"use client";

import { useEffect, useState } from "react";
import { isUuid } from "@/core/client/api-id-utils";
import { readAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import { fetchStoreAttachmentViaApi } from "@/features/closeouts/client/closeout-attachments-api-client";

export function useEntryAttachmentSource(
  attachment,
  {
    storeId = "",
    attachmentsApiEnabled = false,
    organizationId = "",
    actorUserId = "",
    actorRole = "owner",
  } = {},
) {
  const [source, setSource] = useState(attachment?.dataUrl || "");

  useEffect(() => {
    let cancelled = false;

    if (!attachment) {
      setSource("");
      return undefined;
    }

    if (typeof attachment.dataUrl === "string" && attachment.dataUrl) {
      setSource(attachment.dataUrl);
      return undefined;
    }

    const load = async () => {
      if (attachmentsApiEnabled && isUuid(attachment.id) && storeId && organizationId && actorUserId) {
        try {
          const payload = await fetchStoreAttachmentViaApi({
            organizationId,
            actorUserId,
            actorRole,
            storeId,
            attachmentId: attachment.id,
          });
          if (!cancelled && payload?.dataUrl) {
            setSource(payload.dataUrl);
            return;
          }
        } catch (error) {
          console.warn("entry attachment fetch failed", error);
        }
      }

      if (attachment.id) {
        const saved = await readAttachmentPayload(attachment.id);
        if (!cancelled) setSource(saved || "");
        return;
      }

      if (!cancelled) setSource("");
    };

    setSource("");
    load();

    return () => {
      cancelled = true;
    };
  }, [
    actorRole,
    actorUserId,
    attachment,
    attachmentsApiEnabled,
    organizationId,
    storeId,
  ]);

  return source;
}

"use client";

import { useEffect, useState } from "react";
import { isUuid } from "@/core/client/api-id-utils";
import { readAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import { fetchStoreAttachmentViaApi } from "@/features/closeouts/client/closeout-attachments-api-client";
import {
  clearEntryAttachmentSourceCache,
  readResolvedAttachmentSourceCache,
  writeResolvedAttachmentSourceCache,
} from "./entry-attachment-source-cache";

export { clearEntryAttachmentSourceCache };

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
  const attachmentId = typeof attachment?.id === "string" ? attachment.id : "";
  const inlineDataUrl = typeof attachment?.dataUrl === "string" ? attachment.dataUrl : "";
  const cachedSource = attachmentId ? readResolvedAttachmentSourceCache(storeId, attachmentId) : "";
  const [source, setSource] = useState(inlineDataUrl || cachedSource || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!attachmentId && !inlineDataUrl) {
      setSource("");
      setLoading(false);
      return undefined;
    }

    if (inlineDataUrl) {
      setSource(inlineDataUrl);
      setLoading(false);
      if (attachmentId) writeResolvedAttachmentSourceCache(storeId, attachmentId, inlineDataUrl);
      return undefined;
    }

    const cached = readResolvedAttachmentSourceCache(storeId, attachmentId);
    if (cached) {
      setSource(cached);
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      setSource("");
      setLoading(true);

      if (attachmentsApiEnabled && isUuid(attachmentId) && storeId && organizationId && actorUserId) {
        try {
          const payload = await fetchStoreAttachmentViaApi({
            organizationId,
            actorUserId,
            actorRole,
            storeId,
            attachmentId,
          });
          if (!cancelled && payload?.dataUrl) {
            writeResolvedAttachmentSourceCache(storeId, attachmentId, payload.dataUrl);
            setSource(payload.dataUrl);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn("entry attachment fetch failed", error);
        }
      }

      try {
        const saved = await readAttachmentPayload(attachmentId);
        if (!cancelled) {
          const resolved = saved || "";
          if (resolved) writeResolvedAttachmentSourceCache(storeId, attachmentId, resolved);
          setSource(resolved);
        }
      } catch (error) {
        console.warn("entry attachment local read failed", error);
        if (!cancelled) setSource("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    actorRole,
    actorUserId,
    attachmentId,
    attachmentsApiEnabled,
    inlineDataUrl,
    organizationId,
    storeId,
  ]);

  return { source, loading };
}

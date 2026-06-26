"use client";

import { useEffect, useState } from "react";
import { isUuid } from "@/core/client/api-id-utils";
import { readAttachmentPayload } from "@/features/attachments/client/attachment-payload-storage";
import { fetchStoreAttachmentViaApi } from "@/features/closeouts/client/closeout-attachments-api-client";
import {
  clearEntryAttachmentSourceCache,
  readResolvedAttachmentSourceCache,
  writeResolvedAttachmentSourceCache,
} from "./entry-attachment-source-cache";
import type { OperationalEntryAttachment } from "./entries-client-types";

export { clearEntryAttachmentSourceCache };

export function useEntryAttachmentSource(
  attachment: OperationalEntryAttachment | null | undefined,
  {
    storeId = "",
    attachmentsApiEnabled = false,
    organizationId = "",
    actorUserId = "",
    actorRole = "owner",
  }: {
    storeId?: string;
    attachmentsApiEnabled?: boolean;
    organizationId?: string;
    actorUserId?: string;
    actorRole?: string;
  } = {},
) {
  const attachmentId = typeof attachment?.id === "string" ? attachment.id : "";
  const inlineDataUrl = typeof attachment?.dataUrl === "string" ? attachment.dataUrl : "";
  const cachedSource = attachmentId ? readResolvedAttachmentSourceCache(storeId, attachmentId) : "";
  const [source, setSource] = useState(inlineDataUrl || cachedSource || "");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!attachmentId && !inlineDataUrl) {
      setSource("");
      setLoading(false);
      setUnavailable(false);
      return undefined;
    }

    if (inlineDataUrl) {
      setSource(inlineDataUrl);
      setLoading(false);
      setUnavailable(false);
      if (attachmentId) writeResolvedAttachmentSourceCache(storeId, attachmentId, inlineDataUrl);
      return undefined;
    }

    const cached = readResolvedAttachmentSourceCache(storeId, attachmentId);
    if (cached) {
      setSource(cached);
      setLoading(false);
      setUnavailable(false);
      return undefined;
    }

    const load = async () => {
      setSource("");
      setLoading(true);
      setUnavailable(false);
      let resolved = "";

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
            resolved = payload.dataUrl;
          }
        } catch (error) {
          console.warn("entry attachment fetch failed", error);
        }
      }

      if (!resolved && attachmentId) {
        try {
          const saved = await readAttachmentPayload(attachmentId);
          if (!cancelled && saved) {
            writeResolvedAttachmentSourceCache(storeId, attachmentId, saved);
            resolved = saved;
          }
        } catch (error) {
          console.warn("entry attachment local read failed", error);
        }
      }

      if (!cancelled) {
        setSource(resolved);
        setUnavailable(!resolved);
        setLoading(false);
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

  return { source, loading, unavailable };
}

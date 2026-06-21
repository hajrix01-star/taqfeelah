"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchStoreAttachmentViaApi } from "./closeout-attachments-api-client";
import {
  isCloseoutAttachmentRef,
  normalizeCloseoutAttachmentList,
  type CloseoutAttachmentListItem,
} from "./closeout-attachment-utils";

export function useCloseoutAttachmentSrcs({
  enabled = false,
  attachments = [],
  storeId = "",
  organizationId = "",
  actorUserId = "",
  actorRole = "employee",
  attachmentsApiEnabled = false,
}: {
  enabled?: boolean;
  attachments?: unknown;
  storeId?: string;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  attachmentsApiEnabled?: boolean;
}) {
  const normalized = useMemo(
    () => normalizeCloseoutAttachmentList(attachments),
    [attachments],
  );
  const [srcByKey, setSrcByKey] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadedIdsRef = useRef(new Set<string>());
  const inFlightRef = useRef(new Set<string>());

  const resolveSrc = useCallback((item: CloseoutAttachmentListItem) => {
    if (typeof item === "string") return item;
    if (!isCloseoutAttachmentRef(item)) return "";
    return srcByKey[item.id] || "";
  }, [srcByKey]);

  useEffect(() => {
    if (!enabled || !attachmentsApiEnabled || !organizationId || !actorUserId || !storeId) {
      return undefined;
    }

    const inFlightIds = inFlightRef.current;
    const pending = normalized.filter(
      (item): item is CloseoutAttachmentListItem & { id: string } => isCloseoutAttachmentRef(item)
        && !loadedIdsRef.current.has(item.id)
        && !inFlightIds.has(item.id),
    );

    if (!pending.length) return undefined;

    let cancelled = false;
    pending.forEach((item) => inFlightIds.add(item.id));
    setLoading(true);
    setError("");

    Promise.all(
      pending.map(async (item) => {
        const payload = await fetchStoreAttachmentViaApi({
          organizationId,
          actorUserId,
          actorRole,
          storeId,
          attachmentId: item.id,
        });
        return { id: item.id, dataUrl: payload.dataUrl };
      }),
    )
      .then((loaded) => {
        if (cancelled) return;
        loaded.forEach((row) => {
          if (row?.id) loadedIdsRef.current.add(row.id);
        });
        setSrcByKey((current) => {
          const next = { ...current };
          loaded.forEach((row) => {
            if (row?.id && row.dataUrl) next[row.id] = row.dataUrl;
          });
          return next;
        });
      })
      .catch((loadError) => {
        if (cancelled) return;
        console.warn("closeout attachment load failed", loadError);
        setError("failed");
      })
      .finally(() => {
        pending.forEach((item) => inFlightIds.delete(item.id));
        if (!cancelled) setLoading(false);
      });

    const pendingIds = pending.map((item) => item.id);
    return () => {
      cancelled = true;
      pendingIds.forEach((id) => inFlightIds.delete(id));
    };
  }, [
    actorRole,
    actorUserId,
    attachmentsApiEnabled,
    enabled,
    normalized,
    organizationId,
    storeId,
  ]);

  return {
    normalized,
    resolveSrc,
    loading,
    error,
  };
}

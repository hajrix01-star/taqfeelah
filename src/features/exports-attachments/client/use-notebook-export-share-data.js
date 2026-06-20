"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNotebookExportViaApi } from "./exports-attachments-api-client.js";
import {
  buildNotebookExportRequest,
  canFetchNotebookExportForSnapshot,
  mapNotebookExportToShareData,
} from "./notebook-export-share-data.js";

export function useNotebookExportShareData({
  enabled = false,
  auth = {},
  snapshot = null,
}) {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const snapshotKey = useMemo(() => {
    if (!canFetchNotebookExportForSnapshot(snapshot, enabled)) return "";
    return JSON.stringify(buildNotebookExportRequest(snapshot));
  }, [enabled, snapshot]);

  useEffect(() => {
    if (!snapshotKey || !snapshot) {
      setShareData(null);
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    const request = buildNotebookExportRequest(snapshot);
    setLoading(true);
    setError("");

    fetchNotebookExportViaApi({
      organizationId: auth.organizationId || "",
      actorUserId: auth.actorUserId || "",
      actorRole: auth.actorRole || "owner",
      ...request,
    })
      .then((payload) => {
        if (cancelled) return;
        setShareData(mapNotebookExportToShareData(payload, snapshot));
        setError("");
      })
      .catch((failure) => {
        if (cancelled) return;
        console.warn("notebook export share load failed", failure);
        setShareData(null);
        setError(failure instanceof Error ? failure.message : "notebook export failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    auth.actorRole,
    auth.actorUserId,
    auth.organizationId,
    snapshot,
    snapshotKey,
  ]);

  return {
    shareData,
    loading,
    error,
    apiEntries: shareData?.entries || null,
    apiRecord: shareData?.record || null,
    apiChannelRows: shareData?.shareChannelRows || null,
    apiDayRows: shareData?.shareDayRows || null,
    apiProofs: shareData?.proofs,
  };
}

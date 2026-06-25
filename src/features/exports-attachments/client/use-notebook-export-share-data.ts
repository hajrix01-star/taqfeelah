"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNotebookExportViaApi } from "./exports-attachments-api-client";
import {
  buildNotebookExportRequests,
  canFetchNotebookExportForSnapshot,
  combineNotebookExportShareData,
  mapNotebookExportToShareData,
} from "./notebook-export-share-data";
import type {
  NotebookExportShareData,
  UseNotebookExportShareDataProps,
} from "@/features/exports-attachments/client/exports-attachments-client-types";

export function useNotebookExportShareData({
  enabled = false,
  auth = {},
  snapshot = null,
}: UseNotebookExportShareDataProps = {}) {
  const [shareData, setShareData] = useState<NotebookExportShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const snapshotKey = useMemo(() => {
    if (!canFetchNotebookExportForSnapshot(snapshot, enabled)) return "";
    return JSON.stringify(buildNotebookExportRequests(snapshot!));
  }, [enabled, snapshot]);

  useEffect(() => {
    if (!snapshotKey || !snapshot) {
      setShareData(null);
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    const requests = buildNotebookExportRequests(snapshot);
    setLoading(true);
    setError("");

    Promise.all(requests.map((request) => fetchNotebookExportViaApi({
      organizationId: auth.organizationId || "",
      actorUserId: auth.actorUserId || "",
      actorRole: auth.actorRole || "owner",
      ...request,
    })))
      .then((payloads) => {
        if (cancelled) return;
        setShareData(combineNotebookExportShareData(
          payloads.map((payload) => mapNotebookExportToShareData(payload, snapshot)),
        ));
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

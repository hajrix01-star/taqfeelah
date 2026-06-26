"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOwnerNotebookNoteInput,
  deleteOwnerNotebookNote,
  filterOwnerNotebookNotes,
  sortOwnerNotebookNotes,
  toggleOwnerNotebookChecklistItem,
  toggleOwnerNotebookNoteDone,
  updateOwnerNotebookNote,
  writeOwnerNotebookNotes,
} from "../owner-notebook-storage";
import {
  createOwnerNotebookNoteViaApi,
  deleteOwnerNotebookNoteViaApi,
  fetchOwnerNotebookNotesViaApi,
  updateOwnerNotebookNoteViaApi,
} from "./owner-notebook-api-client";
import {
  mergeLegacyOwnerNotebookNotesIntoLocalStore,
  migrateOwnerNotebookNotesToApi,
} from "./owner-notebook-legacy-migration";
import type {
  OwnerNotebookFilter,
  OwnerNotebookNote,
  OwnerNotebookNoteInput,
  OwnerNotebookNotePatch,
  UseOwnerNotebookNotesProps,
} from "@/features/owner-notebook/client/owner-notebook-client-types";

const OWNER_NOTEBOOK_PAGE_SIZE = 50;

function buildNotebookScopeKey(organizationId = "", userId = "") {
  return `${organizationId || "default-org"}:${userId || "default-user"}`;
}

export function useOwnerNotebookNotes({
  organizationId = "",
  userId = "",
  apiEnabled = false,
}: UseOwnerNotebookNotesProps = {}) {
  const [notes, setNotes] = useState<OwnerNotebookNote[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<OwnerNotebookFilter>("active");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const scopeKey = buildNotebookScopeKey(organizationId, userId);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setNotes([]);
    setEditingId(null);
    setLoadError(null);
    setNextCursor(null);
    setLoadingMore(false);

    const load = async () => {
      if (apiEnabled) {
        try {
          const loaded = await fetchOwnerNotebookNotesViaApi({
            organizationId,
            actorUserId: userId,
            limit: OWNER_NOTEBOOK_PAGE_SIZE,
          });
          if (cancelled) return;
          const migration = await migrateOwnerNotebookNotesToApi({
            organizationId,
            actorUserId: userId,
            apiNotes: loaded.notes,
          });
          if (cancelled) return;
          setNotes(sortOwnerNotebookNotes(migration.notes));
          setNextCursor(loaded.nextCursor);
        } catch (error) {
          console.warn("owner notebook load failed", error);
          if (!cancelled) {
            setLoadError("owner-notebook-api-load-failed");
            setNotes([]);
            setNextCursor(null);
          }
        } finally {
          if (!cancelled) setHydrated(true);
        }
        return;
      }

      setNotes(mergeLegacyOwnerNotebookNotesIntoLocalStore({ organizationId, userId }));
      setNextCursor(null);
      setHydrated(true);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [apiEnabled, organizationId, scopeKey, userId]);

  const persistLocal = useCallback((nextNotes: OwnerNotebookNote[]) => {
    const sorted = sortOwnerNotebookNotes(nextNotes);
    setNotes(sorted);
    writeOwnerNotebookNotes(sorted, { organizationId, userId });
    return sorted;
  }, [organizationId, userId]);

  const addNote = useCallback(async (input: OwnerNotebookNoteInput) => {
    const { text, kind = "task", color = "yellow", checklist } = input;
    if (apiEnabled) {
      try {
        const created = await createOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId: userId,
          text,
          kind,
          color,
          checklist,
        });
        if (!created) return null;
        const nextNotes = sortOwnerNotebookNotes([created, ...notesRef.current]);
        setNotes(nextNotes);
        setLoadError(null);
        return created;
      } catch (error) {
        console.warn("owner notebook create failed", error);
        setLoadError("owner-notebook-api-write-failed");
        return null;
      }
    }

    const created = createOwnerNotebookNoteInput({ text, kind, color, checklist });
    if (!created) return null;
    persistLocal([created, ...notesRef.current]);
    return created;
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const saveNote = useCallback(async (noteId: string, patch: OwnerNotebookNotePatch) => {
    if (apiEnabled) {
      try {
        const saved = await updateOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId: userId,
          noteId,
          patch,
        });
        if (!saved) return;
        const nextNotes = sortOwnerNotebookNotes(
          notesRef.current.map((note) => (note.id === noteId ? saved : note)),
        );
        setNotes(nextNotes);
        setLoadError(null);
      } catch (error) {
        console.warn("owner notebook update failed", error);
        setLoadError("owner-notebook-api-write-failed");
      }
      return;
    }

    persistLocal(updateOwnerNotebookNote(notesRef.current, noteId, patch));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const removeNote = useCallback(async (noteId: string) => {
    if (apiEnabled) {
      try {
        await deleteOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId: userId,
          noteId,
        });
        const nextNotes = notesRef.current.filter((note) => note.id !== noteId);
        setNotes(nextNotes);
        setEditingId((current) => (current === noteId ? null : current));
        setLoadError(null);
      } catch (error) {
        console.warn("owner notebook delete failed", error);
        setLoadError("owner-notebook-api-write-failed");
      }
      return;
    }

    persistLocal(deleteOwnerNotebookNote(notesRef.current, noteId));
    setEditingId((current) => (current === noteId ? null : current));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const toggleDone = useCallback(async (noteId: string) => {
    const current = notesRef.current.find((note) => note.id === noteId);
    if (!current || current.kind !== "task" || current.checklist.length > 0) return;

    if (apiEnabled) {
      try {
        const saved = await updateOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId: userId,
          noteId,
          patch: { done: !current.done },
        });
        if (!saved) return;
        const nextNotes = notesRef.current.map((note) => (note.id === noteId ? saved : note));
        setNotes(nextNotes);
        setLoadError(null);
      } catch (error) {
        console.warn("owner notebook toggle failed", error);
        setLoadError("owner-notebook-api-write-failed");
      }
      return;
    }

    persistLocal(toggleOwnerNotebookNoteDone(notesRef.current, noteId));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const toggleChecklistItem = useCallback(async (noteId: string, itemId: string) => {
    const current = notesRef.current.find((note) => note.id === noteId);
    if (!current || current.kind !== "task") return;

    const nextChecklist = current.checklist.map((item) => (
      item.id === itemId ? { ...item, done: !item.done } : item
    ));
    const patch = { checklist: nextChecklist };

    if (apiEnabled) {
      try {
        const saved = await updateOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId: userId,
          noteId,
          patch,
        });
        if (!saved) return;
        const nextNotes = notesRef.current.map((note) => (note.id === noteId ? saved : note));
        setNotes(nextNotes);
        setLoadError(null);
      } catch (error) {
        console.warn("owner notebook checklist toggle failed", error);
        setLoadError("owner-notebook-api-write-failed");
      }
      return;
    }

    persistLocal(toggleOwnerNotebookChecklistItem(notesRef.current, noteId, itemId));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const visibleNotes = useMemo(
    () => filterOwnerNotebookNotes(notes, filter),
    [filter, notes],
  );

  const loadMore = useCallback(async () => {
    if (!apiEnabled || !nextCursor || loadingMore) return false;
    setLoadingMore(true);
    try {
      const page = await fetchOwnerNotebookNotesViaApi({
        organizationId,
        actorUserId: userId,
        limit: OWNER_NOTEBOOK_PAGE_SIZE,
        cursor: nextCursor,
      });
      const seen = new Set(notesRef.current.map((note) => note.id));
      const merged = sortOwnerNotebookNotes([
        ...notesRef.current,
        ...page.notes.filter((note) => !seen.has(note.id)),
      ]);
      setNotes(merged);
      setNextCursor(page.nextCursor);
      setLoadError(null);
      return Boolean(page.nextCursor);
    } catch (error) {
      console.warn("owner notebook load more failed", error);
      setLoadError("owner-notebook-api-load-failed");
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [apiEnabled, loadingMore, nextCursor, organizationId, userId]);

  return {
    hydrated,
    loadError,
    notes,
    visibleNotes,
    hasMore: Boolean(nextCursor),
    loadingMore,
    loadMore,
    filter,
    setFilter,
    editingId,
    setEditingId,
    addNote,
    saveNote,
    removeNote,
    toggleDone,
    toggleChecklistItem,
  };
}

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
  mergeLegacyOwnerNotebookNotesIntoLocal,
  migrateOwnerNotebookNotesToApi,
} from "./owner-notebook-legacy-migration";

function buildNotebookScopeKey(organizationId = "", userId = "") {
  return `${organizationId || "default-org"}:${userId || "default-user"}`;
}

export function useOwnerNotebookNotes({
  organizationId = "",
  userId = "",
  apiEnabled = false,
} = {}) {
  const [notes, setNotes] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("active");
  const [editingId, setEditingId] = useState(null);
  const scopeKey = buildNotebookScopeKey(organizationId, userId);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setNotes([]);
    setEditingId(null);

    const load = async () => {
      if (apiEnabled) {
        try {
          const loaded = await fetchOwnerNotebookNotesViaApi({
            organizationId,
            actorUserId: userId,
          });
          if (cancelled) return;
          const migration = await migrateOwnerNotebookNotesToApi({
            organizationId,
            actorUserId: userId,
            apiNotes: loaded,
          });
          if (cancelled) return;
          setNotes(sortOwnerNotebookNotes(migration.notes));
        } catch (error) {
          console.warn("owner notebook load failed", error);
          if (!cancelled) {
            setNotes(mergeLegacyOwnerNotebookNotesIntoLocal({ organizationId, userId }));
          }
        } finally {
          if (!cancelled) setHydrated(true);
        }
        return;
      }

      setNotes(mergeLegacyOwnerNotebookNotesIntoLocal({ organizationId, userId }));
      setHydrated(true);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [apiEnabled, organizationId, scopeKey, userId]);

  const persistLocal = useCallback((nextNotes) => {
    const sorted = sortOwnerNotebookNotes(nextNotes);
    setNotes(sorted);
    writeOwnerNotebookNotes(sorted, { organizationId, userId });
    return sorted;
  }, [organizationId, userId]);

  const addNote = useCallback(async ({ text, kind = "task", color = "yellow", checklist }) => {
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
        return created;
      } catch (error) {
        console.warn("owner notebook create failed", error);
        return null;
      }
    }

    const created = createOwnerNotebookNoteInput({ text, kind, color, checklist });
    if (!created) return null;
    persistLocal([created, ...notesRef.current]);
    return created;
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const saveNote = useCallback(async (noteId, patch) => {
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
      } catch (error) {
        console.warn("owner notebook update failed", error);
      }
      return;
    }

    persistLocal(updateOwnerNotebookNote(notesRef.current, noteId, patch));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const removeNote = useCallback(async (noteId) => {
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
      } catch (error) {
        console.warn("owner notebook delete failed", error);
      }
      return;
    }

    persistLocal(deleteOwnerNotebookNote(notesRef.current, noteId));
    setEditingId((current) => (current === noteId ? null : current));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const toggleDone = useCallback(async (noteId) => {
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
      } catch (error) {
        console.warn("owner notebook toggle failed", error);
      }
      return;
    }

    persistLocal(toggleOwnerNotebookNoteDone(notesRef.current, noteId));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const toggleChecklistItem = useCallback(async (noteId, itemId) => {
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
      } catch (error) {
        console.warn("owner notebook checklist toggle failed", error);
      }
      return;
    }

    persistLocal(toggleOwnerNotebookChecklistItem(notesRef.current, noteId, itemId));
  }, [apiEnabled, organizationId, persistLocal, userId]);

  const visibleNotes = useMemo(
    () => filterOwnerNotebookNotes(notes, filter),
    [filter, notes],
  );

  return {
    hydrated,
    notes,
    visibleNotes,
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

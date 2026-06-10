"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createOwnerNotebookNoteInput,
  deleteOwnerNotebookNote,
  filterOwnerNotebookNotes,
  readOwnerNotebookNotes,
  sortOwnerNotebookNotes,
  toggleOwnerNotebookNoteDone,
  updateOwnerNotebookNote,
  writeOwnerNotebookNotes,
} from "../owner-notebook-storage";

export function useOwnerNotebookNotes() {
  const [notes, setNotes] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setNotes(readOwnerNotebookNotes());
    setHydrated(true);
  }, []);

  const persist = useCallback((nextNotes) => {
    const sorted = sortOwnerNotebookNotes(nextNotes);
    setNotes(sorted);
    writeOwnerNotebookNotes(sorted);
    return sorted;
  }, []);

  const addNote = useCallback(({ text, kind = "note", color = "yellow" }) => {
    const created = createOwnerNotebookNoteInput({ text, kind, color });
    if (!created) return null;
    persist([created, ...notes]);
    return created;
  }, [notes, persist]);

  const saveNote = useCallback((noteId, patch) => {
    persist(updateOwnerNotebookNote(notes, noteId, patch));
  }, [notes, persist]);

  const removeNote = useCallback((noteId) => {
    persist(deleteOwnerNotebookNote(notes, noteId));
    setEditingId((current) => (current === noteId ? null : current));
  }, [notes, persist]);

  const toggleDone = useCallback((noteId) => {
    persist(toggleOwnerNotebookNoteDone(notes, noteId));
  }, [notes, persist]);

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
  };
}

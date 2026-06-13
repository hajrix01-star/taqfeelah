import { readLocalStorageJson, safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isValidNotebookTheme, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import {
  computeTaskDone,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
} from "./owner-notebook-checklist";

export const OWNER_NOTEBOOK_STORAGE_KEY = "taqfeelah_owner_notebook_v1";

export function buildOwnerNotebookStorageKey(organizationId = "", userId = "") {
  const org = typeof organizationId === "string" && organizationId.trim() ? organizationId.trim() : "default-org";
  const user = typeof userId === "string" && userId.trim() ? userId.trim() : "default-user";
  return `${OWNER_NOTEBOOK_STORAGE_KEY}:${org}:${user}`;
}

export const OWNER_NOTEBOOK_COLOR_IDS = Object.keys(notebookThemes);

const DEFAULT_COLOR = "yellow";

function storageAllowed() {
  return isBrowserPersistentStorageAllowed({ scope: "ui-preferences" });
}

function normalizeColor(color) {
  return isValidNotebookTheme(color) ? color : DEFAULT_COLOR;
}

function normalizeNote(raw) {
  if (!raw || typeof raw !== "object") return null;
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  const kind = raw.kind === "task" ? "task" : "note";
  const checklist = kind === "task" ? normalizeChecklist(raw.checklist) : [];
  if (!hasOwnerNotebookTaskContent(kind, text, checklist)) return null;
  const done = computeTaskDone(kind, checklist, raw.done);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `note-${Date.now()}`,
    text,
    kind,
    checklist,
    done,
    color: normalizeColor(raw.color),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function sortOwnerNotebookNotes(notes = []) {
  return [...notes].sort((left, right) => (
    `${right.updatedAt}`.localeCompare(`${left.updatedAt}`)
  ));
}

export function parseOwnerNotebookNotesRaw(stored) {
  if (!Array.isArray(stored)) return [];
  return sortOwnerNotebookNotes(stored.map(normalizeNote).filter(Boolean));
}

export function readOwnerNotebookNotesFromStorageKey(storageKey) {
  if (!storageAllowed() || typeof window === "undefined" || !storageKey) return [];
  const stored = readLocalStorageJson(storageKey, [], { scope: "ui-preferences" });
  return parseOwnerNotebookNotesRaw(stored);
}

export function readOwnerNotebookNotes({ organizationId = "", userId = "" } = {}) {
  return readOwnerNotebookNotesFromStorageKey(
    buildOwnerNotebookStorageKey(organizationId, userId),
  );
}

export function writeOwnerNotebookNotes(notes, { organizationId = "", userId = "" } = {}) {
  if (!storageAllowed() || typeof window === "undefined") return { ok: false, error: "disabled" };
  const normalized = sortOwnerNotebookNotes(notes.map(normalizeNote).filter(Boolean));
  return safeSetLocalStorageItem(
    buildOwnerNotebookStorageKey(organizationId, userId),
    JSON.stringify(normalized),
    { scope: "ui-preferences" },
  );
}

export function createOwnerNotebookNoteInput(input = {}) {
  const now = new Date().toISOString();
  const kind = input.kind === "task" ? "task" : "note";
  const checklist = kind === "task" ? normalizeChecklist(input.checklist) : [];
  const done = computeTaskDone(kind, checklist, false);
  return normalizeNote({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: input.text,
    kind,
    checklist,
    done,
    color: input.color,
    createdAt: now,
    updatedAt: now,
  });
}

export function updateOwnerNotebookNote(notes, noteId, patch = {}) {
  const now = new Date().toISOString();
  return notes
    .map((note) => {
      if (note.id !== noteId) return note;
      const nextKind = patch.kind === "task" || patch.kind === "note" ? patch.kind : note.kind;
      const nextText = typeof patch.text === "string" ? patch.text.trim() : note.text;
      const nextChecklist = nextKind === "task"
        ? normalizeChecklist(patch.checklist ?? note.checklist)
        : [];
      if (!hasOwnerNotebookTaskContent(nextKind, nextText, nextChecklist)) return null;
      const nextDone = nextKind === "task"
        ? computeTaskDone("task", nextChecklist, patch.done ?? note.done)
        : false;
      return normalizeNote({
        ...note,
        ...patch,
        text: nextText,
        kind: nextKind,
        checklist: nextChecklist,
        done: nextDone,
        color: patch.color ? normalizeColor(patch.color) : note.color,
        updatedAt: now,
      });
    })
    .filter(Boolean);
}

export function deleteOwnerNotebookNote(notes, noteId) {
  return notes.filter((note) => note.id !== noteId);
}

export function toggleOwnerNotebookNoteDone(notes, noteId) {
  return notes.map((note) => {
    if (note.id !== noteId || note.kind !== "task" || note.checklist.length > 0) return note;
    return { ...note, done: !note.done };
  });
}

export function toggleOwnerNotebookChecklistItem(notes, noteId, itemId) {
  return notes.map((note) => {
    if (note.id !== noteId || note.kind !== "task") return note;
    const checklist = note.checklist.map((item) => (
      item.id === itemId ? { ...item, done: !item.done } : item
    ));
    return {
      ...note,
      checklist,
      done: computeTaskDone("task", checklist, false),
    };
  });
}

export function filterOwnerNotebookNotes(notes, filter = "active") {
  if (filter === "active") {
    return notes.filter((note) => note.kind === "note" || !note.done);
  }
  if (filter === "tasks") return notes.filter((note) => note.kind === "task" && !note.done);
  if (filter === "notes") return notes.filter((note) => note.kind === "note");
  if (filter === "done") return notes.filter((note) => note.kind === "task" && note.done);
  return notes;
}

export function getOwnerNotebookColorOptions() {
  return OWNER_NOTEBOOK_COLOR_IDS.map((id) => ({
    id,
    paper: notebookThemes[id].paper,
  }));
}

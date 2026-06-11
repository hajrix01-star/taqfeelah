import { readLocalStorageJson, safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isValidNotebookTheme, notebookThemes } from "@/features/daily-closeouts/notebook-themes";

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
  if (!text) return null;
  const kind = raw.kind === "task" ? "task" : "note";
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `note-${Date.now()}`,
    text,
    kind,
    done: kind === "task" ? Boolean(raw.done) : false,
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

export function readOwnerNotebookNotes({ organizationId = "", userId = "" } = {}) {
  if (!storageAllowed() || typeof window === "undefined") return [];
  const storageKey = buildOwnerNotebookStorageKey(organizationId, userId);
  const stored = readLocalStorageJson(storageKey, [], { scope: "ui-preferences" });
  if (!Array.isArray(stored)) return [];
  return sortOwnerNotebookNotes(stored.map(normalizeNote).filter(Boolean));
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
  return normalizeNote({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: input.text,
    kind,
    done: false,
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
      if (!nextText) return null;
      return normalizeNote({
        ...note,
        ...patch,
        text: nextText,
        kind: nextKind,
        done: nextKind === "task" ? Boolean(patch.done ?? note.done) : false,
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
  return notes.map((note) => (
    note.id === noteId && note.kind === "task"
      ? { ...note, done: !note.done }
      : note
  ));
}

export function filterOwnerNotebookNotes(notes, filter = "all") {
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

import { readLocalStorageJson, safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isValidNotebookTheme, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import {
  computeTaskDone,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
  type OwnerNotebookChecklistItem,
} from "./owner-notebook-checklist";
import type {
  OwnerNotebookFilter,
  OwnerNotebookNote,
  OwnerNotebookNoteInput,
  OwnerNotebookNotePatch,
  OwnerNotebookStorageScope,
  WriteOwnerNotebookNotesResult,
} from "./owner-notebook-types";

export const OWNER_NOTEBOOK_STORAGE_KEY = "taqfeelah_owner_notebook_v1";

export function buildOwnerNotebookStorageKey(organizationId = "", userId = ""): string {
  const org = typeof organizationId === "string" && organizationId.trim() ? organizationId.trim() : "default-org";
  const user = typeof userId === "string" && userId.trim() ? userId.trim() : "default-user";
  return `${OWNER_NOTEBOOK_STORAGE_KEY}:${org}:${user}`;
}

export const OWNER_NOTEBOOK_COLOR_IDS = Object.keys(notebookThemes);

const DEFAULT_COLOR = "yellow";

function storageAllowed(): boolean {
  return isBrowserPersistentStorageAllowed({ scope: "ui-preferences" });
}

function normalizeColor(color: unknown): string {
  return isValidNotebookTheme(String(color || "")) ? String(color) : DEFAULT_COLOR;
}

function normalizeNote(raw: unknown): OwnerNotebookNote | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  const kind = record.kind === "task" ? "task" : "note";
  const checklist: OwnerNotebookChecklistItem[] = kind === "task" ? normalizeChecklist(record.checklist) : [];
  if (!hasOwnerNotebookTaskContent(kind, text, checklist)) return null;
  const done = computeTaskDone(kind, checklist, Boolean(record.done));
  return {
    id: typeof record.id === "string" && record.id ? record.id : `note-${Date.now()}`,
    text,
    kind,
    checklist,
    done,
    color: normalizeColor(record.color),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}

export function sortOwnerNotebookNotes(notes: OwnerNotebookNote[] = []): OwnerNotebookNote[] {
  return [...notes].sort((left, right) => (
    `${right.updatedAt}`.localeCompare(`${left.updatedAt}`)
  ));
}

export function parseOwnerNotebookNotesRaw(stored: unknown): OwnerNotebookNote[] {
  if (!Array.isArray(stored)) return [];
  return sortOwnerNotebookNotes(stored.map(normalizeNote).filter(Boolean) as OwnerNotebookNote[]);
}

export function readOwnerNotebookNotesFromStorageKey(storageKey: string): OwnerNotebookNote[] {
  if (!storageAllowed() || typeof window === "undefined" || !storageKey) return [];
  const stored = readLocalStorageJson<unknown[]>(storageKey, [], { scope: "ui-preferences" });
  return parseOwnerNotebookNotesRaw(stored);
}

export function readOwnerNotebookNotes(scope: OwnerNotebookStorageScope = {}): OwnerNotebookNote[] {
  return readOwnerNotebookNotesFromStorageKey(
    buildOwnerNotebookStorageKey(scope.organizationId, scope.userId),
  );
}

export function writeOwnerNotebookNotes(
  notes: OwnerNotebookNote[],
  scope: OwnerNotebookStorageScope = {},
): WriteOwnerNotebookNotesResult {
  if (!storageAllowed() || typeof window === "undefined") return { ok: false, error: "disabled" };
  const normalized = sortOwnerNotebookNotes(notes.map(normalizeNote).filter(Boolean) as OwnerNotebookNote[]);
  return safeSetLocalStorageItem(
    buildOwnerNotebookStorageKey(scope.organizationId, scope.userId),
    JSON.stringify(normalized),
    { scope: "ui-preferences" },
  );
}

export function createOwnerNotebookNoteInput(input: OwnerNotebookNoteInput = {}): OwnerNotebookNote | null {
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

export function updateOwnerNotebookNote(
  notes: OwnerNotebookNote[],
  noteId: string,
  patch: OwnerNotebookNotePatch = {},
): OwnerNotebookNote[] {
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
    .filter(Boolean) as OwnerNotebookNote[];
}

export function deleteOwnerNotebookNote(notes: OwnerNotebookNote[], noteId: string): OwnerNotebookNote[] {
  return notes.filter((note) => note.id !== noteId);
}

export function toggleOwnerNotebookNoteDone(notes: OwnerNotebookNote[], noteId: string): OwnerNotebookNote[] {
  return notes.map((note) => {
    if (note.id !== noteId || note.kind !== "task" || note.checklist.length > 0) return note;
    return { ...note, done: !note.done };
  });
}

export function toggleOwnerNotebookChecklistItem(
  notes: OwnerNotebookNote[],
  noteId: string,
  itemId: string,
): OwnerNotebookNote[] {
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

export function filterOwnerNotebookNotes(
  notes: OwnerNotebookNote[],
  filter: OwnerNotebookFilter = "active",
): OwnerNotebookNote[] {
  if (filter === "active") {
    return notes.filter((note) => note.kind === "note" || !note.done);
  }
  if (filter === "tasks") return notes.filter((note) => note.kind === "task" && !note.done);
  if (filter === "notes") return notes.filter((note) => note.kind === "note");
  if (filter === "done") return notes.filter((note) => note.kind === "task" && note.done);
  return notes;
}

export function getOwnerNotebookColorOptions(): Array<{ id: string; paper: string }> {
  return OWNER_NOTEBOOK_COLOR_IDS.map((id) => ({
    id,
    paper: notebookThemes[id as keyof typeof notebookThemes].paper,
  }));
}

export type { OwnerNotebookNote, OwnerNotebookNoteInput, OwnerNotebookNotePatch } from "./owner-notebook-types";

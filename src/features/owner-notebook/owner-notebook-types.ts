import type { DisplayLang } from "@/core/i18n/display-locale";
import type { LocalStorageWriteResult } from "@/features/demo/demo-types";

export type OwnerNotebookNoteKind = "note" | "task";

export type OwnerNotebookChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type OwnerNotebookNote = {
  id: string;
  text: string;
  kind: OwnerNotebookNoteKind;
  checklist: OwnerNotebookChecklistItem[];
  done: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type OwnerNotebookNoteInput = {
  text?: string;
  kind?: OwnerNotebookNoteKind | string;
  checklist?: OwnerNotebookChecklistItem[];
  color?: string;
};

export type OwnerNotebookNotePatch = Partial<OwnerNotebookNoteInput> & {
  done?: boolean;
};

export type OwnerNotebookStorageScope = {
  organizationId?: string;
  userId?: string;
};

export type OwnerNotebookFilter = "active" | "tasks" | "notes" | "done" | string;

export type OwnerNotebookColorOption = {
  id: string;
  paper: string;
};

export type WriteOwnerNotebookNotesResult = LocalStorageWriteResult;

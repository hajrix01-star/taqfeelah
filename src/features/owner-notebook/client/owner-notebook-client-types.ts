import type { RuntimeSettingsAuth } from "@/features/runtime-settings/client/runtime-settings-client-types";
import type {
  OwnerNotebookChecklistItem,
  OwnerNotebookFilter,
  OwnerNotebookNote,
  OwnerNotebookNoteInput,
  OwnerNotebookNotePatch,
  OwnerNotebookNoteKind,
} from "@/features/owner-notebook/owner-notebook-types";

export type OwnerNotebookApiContext = RuntimeSettingsAuth & {
  actorUserId?: string;
};

export type CreateOwnerNotebookNoteViaApiInput = OwnerNotebookApiContext & OwnerNotebookNoteInput;

export type UpdateOwnerNotebookNoteViaApiInput = OwnerNotebookApiContext & {
  noteId: string;
  patch?: OwnerNotebookNotePatch;
};

export type DeleteOwnerNotebookNoteViaApiInput = OwnerNotebookApiContext & {
  noteId: string;
};

export type UseOwnerNotebookNotesProps = {
  organizationId?: string;
  userId?: string;
  apiEnabled?: boolean;
};

export type OwnerNotebookShareLabels = {
  done?: string;
  task?: string;
  note?: string;
};

export type OwnerNotebookNoteSharePreviewProps = {
  lang?: "ar" | "en";
  theme?: string;
  fluid?: boolean;
  periodLabel: string;
  title: string;
  kindLabel: string;
  kind?: OwnerNotebookNoteKind;
  done?: boolean;
  noteText?: string;
  checklist?: OwnerNotebookChecklistItem[];
};

export type {
  OwnerNotebookNote,
  OwnerNotebookFilter,
  OwnerNotebookChecklistItem,
  OwnerNotebookNoteInput,
  OwnerNotebookNotePatch,
} from "@/features/owner-notebook/owner-notebook-types";

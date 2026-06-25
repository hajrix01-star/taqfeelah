import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import type {
  CreateOwnerNotebookNoteViaApiInput,
  DeleteOwnerNotebookNoteViaApiInput,
  FetchOwnerNotebookNotesViaApiInput,
  FetchOwnerNotebookNotesViaApiResult,
  OwnerNotebookApiContext,
  UpdateOwnerNotebookNoteViaApiInput,
} from "@/features/owner-notebook/client/owner-notebook-client-types";
import type { OwnerNotebookNote } from "@/features/owner-notebook/owner-notebook-types";

function buildOwnerNotebookApiContext({
  organizationId = "",
  actorUserId = "",
}: OwnerNotebookApiContext = {}) {
  return {
    organizationId,
    actorUserId,
    actorRole: "owner",
  };
}

export async function fetchOwnerNotebookNotesViaApi({
  limit = 50,
  cursor = null,
  ...context
}: FetchOwnerNotebookNotesViaApiInput = {}): Promise<FetchOwnerNotebookNotesViaApiResult> {
  const search = new URLSearchParams();
  search.set("limit", String(limit));
  if (cursor) search.set("cursor", cursor);
  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/owner-notebook/notes?${search.toString()}`, {
    ...buildOwnerNotebookApiContext(context),
    errorMessage: "Failed to load owner notebook notes.",
  }) as { notes?: OwnerNotebookNote[]; nextCursor?: string | null };
  return {
    notes: Array.isArray(payload?.notes) ? payload.notes : [],
    nextCursor: typeof payload?.nextCursor === "string" ? payload.nextCursor : null,
  };
}

export async function createOwnerNotebookNoteViaApi({
  text,
  kind = "task",
  color = "yellow",
  checklist,
  ...context
}: CreateOwnerNotebookNoteViaApiInput = {}) {
  const payload = await fetchApiJsonWithPrototypeContext("/api/v1/owner-notebook/notes", {
    ...buildOwnerNotebookApiContext(context),
    method: "POST",
    body: {
      text,
      kind,
      color,
      ...(Array.isArray(checklist) ? { checklist } : {}),
    },
    errorMessage: "Failed to create owner notebook note.",
  }) as { note?: OwnerNotebookNote };
  return payload?.note || null;
}

export async function updateOwnerNotebookNoteViaApi({
  noteId,
  patch = {},
  ...context
}: UpdateOwnerNotebookNoteViaApiInput) {
  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/owner-notebook/notes/${noteId}`, {
    ...buildOwnerNotebookApiContext(context),
    method: "PATCH",
    body: patch,
    errorMessage: "Failed to update owner notebook note.",
  }) as { note?: OwnerNotebookNote };
  return payload?.note || null;
}

export async function deleteOwnerNotebookNoteViaApi({
  noteId,
  ...context
}: DeleteOwnerNotebookNoteViaApiInput) {
  return fetchApiJsonWithPrototypeContext(`/api/v1/owner-notebook/notes/${noteId}`, {
    ...buildOwnerNotebookApiContext(context),
    method: "DELETE",
    errorMessage: "Failed to delete owner notebook note.",
  });
}

import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";

function buildOwnerNotebookApiContext({
  organizationId = "",
  actorUserId = "",
} = {}) {
  return {
    organizationId,
    actorUserId,
    actorRole: "owner",
  };
}

export async function fetchOwnerNotebookNotesViaApi(context = {}) {
  const payload = await fetchApiJsonWithPrototypeContext("/api/v1/owner-notebook/notes", {
    ...buildOwnerNotebookApiContext(context),
    errorMessage: "Failed to load owner notebook notes.",
  });
  return Array.isArray(payload?.notes) ? payload.notes : [];
}

export async function createOwnerNotebookNoteViaApi({
  text,
  kind = "task",
  color = "yellow",
  checklist,
  ...context
} = {}) {
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
  });
  return payload?.note || null;
}

export async function updateOwnerNotebookNoteViaApi({
  noteId,
  patch = {},
  ...context
} = {}) {
  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/owner-notebook/notes/${noteId}`, {
    ...buildOwnerNotebookApiContext(context),
    method: "PATCH",
    body: patch,
    errorMessage: "Failed to update owner notebook note.",
  });
  return payload?.note || null;
}

export async function deleteOwnerNotebookNoteViaApi({
  noteId,
  ...context
} = {}) {
  return fetchApiJsonWithPrototypeContext(`/api/v1/owner-notebook/notes/${noteId}`, {
    ...buildOwnerNotebookApiContext(context),
    method: "DELETE",
    errorMessage: "Failed to delete owner notebook note.",
    parseBody: false,
  });
}

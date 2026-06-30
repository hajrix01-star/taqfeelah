import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import {
  deleteOwnerNotebookNote,
  updateOwnerNotebookNote,
} from "@/features/owner-notebook/server/owner-notebook-notes-service";

export const dynamic = "force-dynamic";

export const PATCH = withAuthedApiRoute<{ noteId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  return updateOwnerNotebookNote({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    noteId: params.noteId,
    text: typeof body?.text === "string" ? body.text : undefined,
    kind: body?.kind === "task" || body?.kind === "note" ? body.kind : undefined,
    done: typeof body?.done === "boolean" ? body.done : undefined,
    color: typeof body?.color === "string" ? body.color : undefined,
    checklist: Array.isArray(body?.checklist) ? body.checklist : undefined,
  });
});

export const DELETE = withAuthedApiRoute<{ noteId: string }>(({ auth, params }) =>
  deleteOwnerNotebookNote({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    noteId: params.noteId,
  })
);

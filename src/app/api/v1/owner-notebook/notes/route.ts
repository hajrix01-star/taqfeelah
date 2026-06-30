import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import {
  createOwnerNotebookNote,
  listOwnerNotebookNotes,
} from "@/features/owner-notebook/server/owner-notebook-notes-service";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, searchParams }) => {
  const rawLimit = Number(searchParams.get("limit") || "50");
  return listOwnerNotebookNotes({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    limit: Number.isFinite(rawLimit) ? rawLimit : 50,
    cursor: searchParams.get("cursor") || undefined,
  });
});

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  return createOwnerNotebookNote({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    text: typeof body?.text === "string" ? body.text : "",
    kind: body?.kind === "task" ? "task" : body?.kind === "note" ? "note" : "task",
    color: typeof body?.color === "string" ? body.color : "yellow",
    checklist: Array.isArray(body?.checklist) ? body.checklist : undefined,
  });
});

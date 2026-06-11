import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import {
  deleteOwnerNotebookNote,
  updateOwnerNotebookNote,
} from "@/features/owner-notebook/server/owner-notebook-notes-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ noteId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const result = await updateOwnerNotebookNote({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      noteId: params.noteId,
      text: typeof body?.text === "string" ? body.text : undefined,
      kind: body?.kind === "task" || body?.kind === "note" ? body.kind : undefined,
      done: typeof body?.done === "boolean" ? body.done : undefined,
      color: typeof body?.color === "string" ? body.color : undefined,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });

    const result = await deleteOwnerNotebookNote({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      noteId: params.noteId,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

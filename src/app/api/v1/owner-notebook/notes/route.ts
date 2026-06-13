import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import {
  createOwnerNotebookNote,
  listOwnerNotebookNotes,
} from "@/features/owner-notebook/server/owner-notebook-notes-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const result = await listOwnerNotebookNotes({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const result = await createOwnerNotebookNote({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      text: typeof body?.text === "string" ? body.text : "",
      kind: body?.kind === "task" ? "task" : body?.kind === "note" ? "note" : "task",
      color: typeof body?.color === "string" ? body.color : "yellow",
      checklist: Array.isArray(body?.checklist) ? body.checklist : undefined,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

import { resolveRequestContext } from "@/core/auth/request-context";
import { fail } from "@/core/http/api-response";
import { readEnv } from "@/core/config/env";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { subscribeOperationalSyncEvents } from "@/core/sync/operational-sync-bus";
import { OPERATIONAL_SYNC_SSE_HEARTBEAT_MS } from "@/core/sync/operational-sync-policy";
import type { OperationalSyncEvent } from "@/core/sync/operational-sync-event-types";

export const dynamic = "force-dynamic";

function encodeSseMessage(event: OperationalSyncEvent): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function encodeSseComment(comment: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`: ${comment}\n\n`);
}

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const organizationId = requestContext.organizationId;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeSseComment("connected"));

        const unsubscribe = subscribeOperationalSyncEvents(organizationId, (event) => {
          try {
            controller.enqueue(encodeSseMessage(event));
          } catch (error) {
            console.warn("operational sync SSE enqueue failed", error);
          }
        });

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encodeSseComment("heartbeat"));
          } catch {
            clearInterval(heartbeat);
          }
        }, OPERATIONAL_SYNC_SSE_HEARTBEAT_MS);

        const abort = () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // stream already closed
          }
        };

        if (request.signal.aborted) {
          abort();
          return;
        }

        request.signal.addEventListener("abort", abort, { once: true });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return fail(error);
  }
}

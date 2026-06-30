import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
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

export const GET = withAuthedApiRouteNoParams(({ auth, request }) => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encodeSseComment("connected"));

      const unsubscribe = subscribeOperationalSyncEvents(auth.organizationId, (event) => {
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
});

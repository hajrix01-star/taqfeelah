import { buildPrototypeApiAuthHeaders } from "@/core/client/prototype-api-auth-headers";
import { parseSseChunk } from "@/core/client/parse-sse-stream";
import {
  operationalSyncEventSchema,
  type OperationalSyncEvent,
} from "@/core/sync/operational-sync-event-types";

export type ConnectOperationalSyncStreamInput = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  signal: AbortSignal;
  onEvent: (event: OperationalSyncEvent) => void;
  onConnected?: () => void;
  onError?: (error: unknown) => void;
};

export async function connectOperationalSyncStream({
  organizationId,
  actorUserId,
  actorRole,
  signal,
  onEvent,
  onConnected,
  onError,
}: ConnectOperationalSyncStreamInput): Promise<void> {
  let response: Response;
  const authHeaders = new Headers(
    Object.entries(
      buildPrototypeApiAuthHeaders({
        organizationId,
        actorUserId,
        actorRole,
      }),
    ),
  );
  try {
    response = await fetch("/api/v1/operational-events/stream", {
      method: "GET",
      credentials: "include",
      headers: authHeaders,
      signal,
    });
  } catch (error) {
    onError?.(error);
    throw error;
  }

  if (!response.ok || !response.body) {
    onError?.(new Error(`operational sync stream failed: ${response.status}`));
    return;
  }

  onConnected?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.remainder;

    for (const chunk of parsed.events) {
      if (chunk.event === "message" && !chunk.data) continue;
      try {
        const payload = JSON.parse(chunk.data);
        const event = operationalSyncEventSchema.parse(payload);
        onEvent(event);
      } catch (error) {
        console.warn("operational sync event parse failed", error);
      }
    }
  }
}

import { describe, expect, it } from "vitest";
import { parseSseChunk } from "@/core/client/parse-sse-stream";

describe("parseSseChunk", () => {
  it("parses event and data blocks", () => {
    const { events, remainder } = parseSseChunk(
      "event: closeout.submitted\n"
      + "data: {\"type\":\"closeout.submitted\"}\n\n"
      + "event: entry.created\n"
      + "data: {\"type\":\"entry.created\"}\n\n",
    );

    expect(events).toEqual([
      { event: "closeout.submitted", data: "{\"type\":\"closeout.submitted\"}" },
      { event: "entry.created", data: "{\"type\":\"entry.created\"}" },
    ]);
    expect(remainder).toBe("");
  });

  it("ignores heartbeat comments and keeps partial blocks", () => {
    const { events, remainder } = parseSseChunk(
      ": connected\n\n"
      + "event: closeout.deleted\n"
      + "data: {\"type\":\"closeout.deleted\"}\n\n"
      + "event: entry.created\n"
      + "data: {\"partial\":",
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("closeout.deleted");
    expect(remainder).toContain("event: entry.created");
  });
});

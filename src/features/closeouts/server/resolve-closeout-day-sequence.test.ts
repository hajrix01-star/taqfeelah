import { describe, expect, it } from "vitest";
import { resolveCloseoutDaySequence } from "./resolve-closeout-day-sequence";

function createSequenceTx(options: {
  previousMetadata?: Record<string, unknown> | null;
  maxSequence?: number;
}) {
  return {
    select: (fields: unknown) => ({
      from: () => {
        const isMetadataSelect = Boolean(
          fields && typeof fields === "object" && "metadata" in (fields as object),
        );
        return {
          where: () => {
            if (isMetadataSelect) {
              return {
                orderBy: () => ({
                  limit: async () => (
                    options.previousMetadata ? [{ metadata: options.previousMetadata }] : []
                  ),
                }),
              };
            }
            return Promise.resolve([{ maxSequence: options.maxSequence ?? 0 }]);
          },
        };
      },
    }),
  };
}

describe("resolveCloseoutDaySequence", () => {
  it("assigns the next sequence for a new closeout on the same day", async () => {
    const sequence = await resolveCloseoutDaySequence(
      createSequenceTx({ maxSequence: 1 }) as Parameters<typeof resolveCloseoutDaySequence>[0],
      {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      date: "2026-06-06",
      closeoutId: "closeout-2",
      mode: "submit",
      },
    );

    expect(sequence).toBe(2);
  });

  it("reuses the same sequence on resubmit", async () => {
    const sequence = await resolveCloseoutDaySequence(
      createSequenceTx({
      previousMetadata: { closeoutId: "closeout-2", date: "2026-06-06", daySequence: 2 },
      }) as Parameters<typeof resolveCloseoutDaySequence>[0],
      {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      date: "2026-06-06",
      closeoutId: "closeout-2",
      mode: "resubmit",
      },
    );

    expect(sequence).toBe(2);
  });
});

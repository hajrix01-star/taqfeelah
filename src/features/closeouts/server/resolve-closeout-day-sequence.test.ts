import { describe, expect, it } from "vitest";
import { resolveCloseoutDaySequence } from "./resolve-closeout-day-sequence";

function createSequenceTx(options: {
  existingDaySequence?: number | null;
  maxSequence?: number;
}) {
  return {
    select: (fields: unknown) => ({
      from: () => {
        const isExistingSelect = Boolean(
          fields && typeof fields === "object" && "daySequence" in (fields as object),
        );
        return {
          where: () => {
            if (isExistingSelect) {
              return {
                limit: async () => (
                  options.existingDaySequence
                    ? [{ daySequence: options.existingDaySequence }]
                    : []
                ),
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

  it("reuses the same sequence on owner edit", async () => {
    const sequence = await resolveCloseoutDaySequence(
      createSequenceTx({ existingDaySequence: 2 }) as Parameters<typeof resolveCloseoutDaySequence>[0],
      {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        date: "2026-06-06",
        closeoutId: "closeout-2",
        mode: "ownerEdit",
      },
    );

    expect(sequence).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildOwnerNotebookNoteFingerprint,
  filterOwnerNotebookNotesMissingFromApi,
} from "./owner-notebook-legacy-migration";

describe("owner-notebook-legacy-migration", () => {
  it("builds stable fingerprints for dedupe", () => {
    const note = {
      text: "تذكير",
      kind: "note" as const,
      createdAt: "2026-01-01T10:00:00.000Z",
    };
    expect(buildOwnerNotebookNoteFingerprint(note)).toBe("تذكير|note|2026-01-01T10:00:00.000Z");
  });

  it("filters local notes that already exist in API", () => {
    const apiNotes = [
      {
        id: "api-1",
        text: "قديمة",
        kind: "note" as const,
        done: false,
        color: "yellow",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
    ];
    const localNotes = [
      {
        id: "local-1",
        text: "قديمة",
        kind: "note" as const,
        done: false,
        color: "yellow",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "local-2",
        text: "جديدة",
        kind: "task" as const,
        done: true,
        color: "ivory",
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: "2026-02-01T10:00:00.000Z",
      },
    ];

    const pending = filterOwnerNotebookNotesMissingFromApi(apiNotes, localNotes);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.text).toBe("جديدة");
  });

  it("dedupes duplicate local entries before migration", () => {
    const localNotes = [
      {
        id: "a",
        text: "نفس",
        kind: "note" as const,
        done: false,
        color: "yellow",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "b",
        text: "نفس",
        kind: "note" as const,
        done: false,
        color: "yellow",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
    ];

    const pending = filterOwnerNotebookNotesMissingFromApi([], localNotes);
    expect(pending).toHaveLength(1);
  });
});

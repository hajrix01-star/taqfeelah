import { describe, expect, it } from "vitest";
import {
  buildOwnerNotebookNoteFingerprint,
  filterOwnerNotebookNotesMissingFromApi,
} from "./owner-notebook-legacy-migration";

import type { OwnerNotebookNote } from "../owner-notebook-types";

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
    const apiNotes: OwnerNotebookNote[] = [
      {
        id: "api-1",
        text: "قديمة",
        kind: "note",
        done: false,
        color: "yellow",
        checklist: [],
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
    ];
    const localNotes: OwnerNotebookNote[] = [
      {
        id: "local-1",
        text: "قديمة",
        kind: "note",
        done: false,
        color: "yellow",
        checklist: [],
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "local-2",
        text: "جديدة",
        kind: "task",
        done: true,
        color: "ivory",
        checklist: [],
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: "2026-02-01T10:00:00.000Z",
      },
    ];

    const pending = filterOwnerNotebookNotesMissingFromApi(apiNotes, localNotes);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.text).toBe("جديدة");
  });

  it("dedupes duplicate local entries before migration", () => {
    const localNotes: OwnerNotebookNote[] = [
      {
        id: "a",
        text: "نفس",
        kind: "note",
        done: false,
        color: "yellow",
        checklist: [],
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "b",
        text: "نفس",
        kind: "note",
        done: false,
        color: "yellow",
        checklist: [],
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
    ];

    const pending = filterOwnerNotebookNotesMissingFromApi([], localNotes);
    expect(pending).toHaveLength(1);
  });
});

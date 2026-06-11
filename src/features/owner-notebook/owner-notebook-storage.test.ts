import { describe, expect, it } from "vitest";
import {
  buildOwnerNotebookStorageKey,
  createOwnerNotebookNoteInput,
  deleteOwnerNotebookNote,
  filterOwnerNotebookNotes,
  sortOwnerNotebookNotes,
  toggleOwnerNotebookNoteDone,
  updateOwnerNotebookNote,
} from "./owner-notebook-storage";

describe("owner-notebook-storage", () => {
  it("creates note and task entries with normalized colors", () => {
    const note = createOwnerNotebookNoteInput({ text: "  تذكير  ", kind: "note", color: "ivory" });
    const task = createOwnerNotebookNoteInput({ text: "متابعة المورد", kind: "task", color: "unknown" });

    expect(note?.text).toBe("تذكير");
    expect(note?.color).toBe("ivory");
    expect(task?.kind).toBe("task");
    expect(task?.color).toBe("yellow");
    expect(task?.done).toBe(false);
  });

  it("updates and deletes notes", () => {
    const base = [
      createOwnerNotebookNoteInput({ text: "أولى", kind: "note", color: "yellow" }),
      createOwnerNotebookNoteInput({ text: "ثانية", kind: "task", color: "softYellow" }),
    ].filter(Boolean);

    const updated = updateOwnerNotebookNote(base, base[1]!.id, { text: "مهمة محدثة", done: true });
    expect(updated.find((note: { id: string; text?: string; done?: boolean }) => note.id === base[1]!.id)?.text).toBe("مهمة محدثة");
    expect(updated.find((note: { id: string; done?: boolean }) => note.id === base[1]!.id)?.done).toBe(true);

    const removed = deleteOwnerNotebookNote(updated, base[0]!.id);
    expect(removed).toHaveLength(1);
  });

  it("sorts by updatedAt descending", () => {
    const older = createOwnerNotebookNoteInput({ text: "older", kind: "note", color: "yellow" });
    const newer = createOwnerNotebookNoteInput({ text: "newer", kind: "task", color: "yellow" });
    older!.updatedAt = "2026-01-01T10:00:00.000Z";
    newer!.updatedAt = "2026-06-01T10:00:00.000Z";

    const sorted = sortOwnerNotebookNotes([older!, newer!]);
    expect(sorted[0]!.text).toBe("newer");
    expect(sorted[1]!.text).toBe("older");
  });

  it("filters notes by kind", () => {
    const notes = [
      createOwnerNotebookNoteInput({ text: "n1", kind: "note", color: "yellow" }),
      createOwnerNotebookNoteInput({ text: "t1", kind: "task", color: "yellow" }),
    ].filter(Boolean);

    expect(filterOwnerNotebookNotes(notes, "notes")).toHaveLength(1);
    expect(filterOwnerNotebookNotes(notes, "tasks")).toHaveLength(1);
  });

  it("builds tenant-scoped storage keys", () => {
    expect(buildOwnerNotebookStorageKey("org-a", "user-1")).toBe(
      "taqfeelah_owner_notebook_v1:org-a:user-1",
    );
    expect(buildOwnerNotebookStorageKey("org-b", "user-2")).not.toBe(
      buildOwnerNotebookStorageKey("org-a", "user-1"),
    );
  });

  it("toggles task completion without changing updatedAt", () => {
    const task = createOwnerNotebookNoteInput({ text: "task", kind: "task", color: "yellow" });
    const before = task!.updatedAt;
    const toggled = toggleOwnerNotebookNoteDone([task!], task!.id);
    expect(toggled[0]!.done).toBe(true);
    expect(toggled[0]!.updatedAt).toBe(before);
  });
});

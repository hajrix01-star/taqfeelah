import { describe, expect, it } from "vitest";
import {
  computeTaskDone,
  createChecklistItem,
  formatChecklistForShare,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
  toggleChecklistItemInNote,
} from "./owner-notebook-checklist";

describe("owner-notebook-checklist", () => {
  it("normalizes checklist items and drops empty rows", () => {
    expect(normalizeChecklist([
      { id: "a", text: "  بند  ", done: false },
      { id: "b", text: "   ", done: false },
    ])).toEqual([{ id: "a", text: "بند", done: false }]);
  });

  it("computes task done from checklist items", () => {
    const checklist = [
      { id: "1", text: "أول", done: true },
      { id: "2", text: "ثاني", done: false },
    ];
    expect(computeTaskDone("task", checklist, false)).toBe(false);
    expect(computeTaskDone("task", [
      { id: "1", text: "أول", done: true },
      { id: "2", text: "ثاني", done: true },
    ], false)).toBe(true);
    expect(computeTaskDone("note", checklist, true)).toBe(false);
  });

  it("accepts task with checklist only or title only", () => {
    expect(hasOwnerNotebookTaskContent("task", "", [{ id: "1", text: "بند", done: false }])).toBe(true);
    expect(hasOwnerNotebookTaskContent("task", "عنوان", [])).toBe(true);
    expect(hasOwnerNotebookTaskContent("task", "", [])).toBe(false);
    expect(hasOwnerNotebookTaskContent("note", "", [])).toBe(false);
  });

  it("toggles checklist item and recomputes done", () => {
    const note = {
      kind: "task" as const,
      done: false,
      checklist: [
        { id: "1", text: "أول", done: true },
        { id: "2", text: "ثاني", done: false },
      ],
    };
    const toggled = toggleChecklistItemInNote(note, "2");
    expect(toggled.checklist[1]?.done).toBe(true);
    expect(toggled.done).toBe(true);
  });

  it("formats checklist for share captions", () => {
    const item = createChecklistItem("شراء خبز");
    expect(formatChecklistForShare([{ ...item, done: false }])).toContain("☐ شراء خبز");
  });
});

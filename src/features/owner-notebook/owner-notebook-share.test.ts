import { describe, expect, it } from "vitest";
import { buildOwnerNotebookShareCaption, ownerNotebookKindLabel } from "./owner-notebook-share";

describe("owner-notebook-share", () => {
  const note = {
    id: "note-1",
    text: "مراجعة الموردين\nاتصل بأحمد",
    kind: "note",
    done: false,
    color: "blue",
    createdAt: "2026-06-10T10:00:00.000Z",
    updatedAt: "2026-06-10T12:30:00.000Z",
  };

  it("builds Arabic caption with kind and note body", () => {
    const caption = buildOwnerNotebookShareCaption(note, "ar", {
      note: "ملاحظة",
      task: "مهمة",
      done: "منجزة",
    });
    expect(caption.startsWith("دفتري — ملاحظة")).toBe(true);
    expect(caption).toContain("مراجعة الموردين");
    expect(caption).toContain("اتصل بأحمد");
  });

  it("labels completed tasks", () => {
    expect(ownerNotebookKindLabel({ kind: "task", done: true }, "ar", { done: "منجزة", task: "مهمة" })).toBe("منجزة");
  });

  it("includes checklist lines in share caption", () => {
    const caption = buildOwnerNotebookShareCaption({
      ...note,
      kind: "task",
      text: "تجهيز المحل",
      checklist: [
        { id: "1", text: "تنظيف", done: false },
        { id: "2", text: "تعبئة", done: true },
      ],
    }, "ar", { task: "مهمة", done: "منجزة", note: "ملاحظة" });
    expect(caption).toContain("تجهيز المحل");
    expect(caption).toContain("☐ تنظيف");
    expect(caption).toContain("☑ تعبئة");
  });
});

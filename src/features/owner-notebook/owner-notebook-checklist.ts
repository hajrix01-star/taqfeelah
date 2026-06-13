export type OwnerNotebookChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export function createChecklistItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createChecklistItem(text = ""): OwnerNotebookChecklistItem {
  return {
    id: createChecklistItemId(),
    text: typeof text === "string" ? text.trim() : "",
    done: false,
  };
}

export function normalizeChecklist(raw: unknown): OwnerNotebookChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const text = typeof record.text === "string" ? record.text.trim() : "";
      if (!text) return null;
      const id = typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : createChecklistItemId();
      return {
        id,
        text,
        done: Boolean(record.done),
      };
    })
    .filter((item): item is OwnerNotebookChecklistItem => Boolean(item));
}

export function computeTaskDone(
  kind: "note" | "task",
  checklist: OwnerNotebookChecklistItem[],
  manualDone = false,
) {
  if (kind !== "task") return false;
  if (checklist.length > 0) {
    return checklist.every((item) => item.done);
  }
  return Boolean(manualDone);
}

export function hasOwnerNotebookTaskContent(
  kind: "note" | "task",
  text: string,
  checklist: OwnerNotebookChecklistItem[],
) {
  if (kind === "note") return text.trim().length > 0;
  return text.trim().length > 0 || checklist.length > 0;
}

export function toggleChecklistItemInNote<T extends {
  kind: "note" | "task";
  checklist: OwnerNotebookChecklistItem[];
  done: boolean;
}>(note: T, itemId: string): T {
  if (note.kind !== "task") return note;
  const checklist = note.checklist.map((item) => (
    item.id === itemId ? { ...item, done: !item.done } : item
  ));
  return {
    ...note,
    checklist,
    done: computeTaskDone("task", checklist, false),
  };
}

export function formatChecklistForShare(checklist: OwnerNotebookChecklistItem[]) {
  if (!checklist.length) return "";
  return checklist
    .map((item) => `${item.done ? "☑" : "☐"} ${item.text}`)
    .join("\n");
}

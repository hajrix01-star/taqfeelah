import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { ownerNotebookNotes } from "@/core/db/schema";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import {
  computeTaskDone,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
  type OwnerNotebookChecklistItem,
} from "@/features/owner-notebook/owner-notebook-checklist";

const DEFAULT_COLOR = "yellow";

const actorInputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

const noteKindSchema = z.enum(["note", "task"]);

const checklistItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  text: z.string().trim().min(1).max(500),
  done: z.boolean(),
});

const checklistSchema = z.array(checklistItemSchema).max(30);

const createNoteInputSchema = actorInputSchema.extend({
  text: z.string().trim().max(2000).default(""),
  kind: noteKindSchema.default("task"),
  color: z.string().trim().min(1).default(DEFAULT_COLOR),
  checklist: checklistSchema.optional(),
}).superRefine((data, ctx) => {
  const checklist = normalizeChecklist(data.checklist);
  if (!hasOwnerNotebookTaskContent(data.kind, data.text, checklist)) {
    ctx.addIssue({
      code: "custom",
      message: data.kind === "note"
        ? "Note text is required."
        : "Task needs a title or checklist item.",
      path: ["text"],
    });
  }
});

const updateNoteInputSchema = actorInputSchema.extend({
  noteId: z.string().uuid(),
  text: z.string().trim().max(2000).optional(),
  kind: noteKindSchema.optional(),
  done: z.boolean().optional(),
  color: z.string().trim().min(1).optional(),
  checklist: checklistSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.kind !== "note" && data.text === undefined && data.checklist === undefined) {
    return;
  }
  const kind = data.kind ?? "task";
  const text = data.text ?? "";
  const checklist = data.checklist ? normalizeChecklist(data.checklist) : [];
  if (data.text !== undefined || data.kind !== undefined || data.checklist !== undefined) {
    if (kind === "note" && !text.trim()) {
      ctx.addIssue({ code: "custom", message: "Note text is required.", path: ["text"] });
    }
    if (kind === "task" && data.text !== undefined && data.checklist !== undefined
      && !hasOwnerNotebookTaskContent("task", text, checklist)) {
      ctx.addIssue({
        code: "custom",
        message: "Task needs a title or checklist item.",
        path: ["text"],
      });
    }
  }
});

const deleteNoteInputSchema = actorInputSchema.extend({
  noteId: z.string().uuid(),
});

export type OwnerNotebookNotePayload = {
  id: string;
  text: string;
  kind: "note" | "task";
  done: boolean;
  color: string;
  checklist: OwnerNotebookChecklistItem[];
  createdAt: string;
  updatedAt: string;
};

function assertOwnerOnly(actorRole: z.infer<typeof actorInputSchema>["actorRole"]) {
  if (actorRole !== "owner") {
    throw new ForbiddenError("Owner notebook notes are private to the organization owner.");
  }
}

function normalizeColor(color: string | undefined) {
  if (color && isValidNotebookTheme(color)) return color;
  return DEFAULT_COLOR;
}

function mapRow(row: {
  id: string;
  text: string;
  kind: string;
  done: boolean;
  color: string;
  checklist: unknown;
  createdAt: Date;
  updatedAt: Date;
}): OwnerNotebookNotePayload {
  const kind = row.kind === "task" ? "task" : "note";
  const checklist = kind === "task" ? normalizeChecklist(row.checklist) : [];
  return {
    id: row.id,
    text: row.text,
    kind,
    checklist,
    done: computeTaskDone(kind, checklist, row.done),
    color: normalizeColor(row.color),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertOwnerNotebookAccess(input: z.infer<typeof actorInputSchema>) {
  assertOwnerOnly(input.actorRole);
  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });
}

function resolveNextChecklist(
  kind: "note" | "task",
  existingChecklist: OwnerNotebookChecklistItem[],
  patchChecklist: OwnerNotebookChecklistItem[] | undefined,
) {
  if (kind !== "task") return [];
  if (patchChecklist !== undefined) return normalizeChecklist(patchChecklist);
  return existingChecklist;
}

function isOnlyDoneMutation(
  existing: {
    text: string;
    kind: string;
    done: boolean;
    color: string;
    checklist: OwnerNotebookChecklistItem[];
  },
  next: {
    text: string;
    kind: "note" | "task";
    done: boolean;
    color: string;
    checklist: OwnerNotebookChecklistItem[];
  },
  input: z.infer<typeof updateNoteInputSchema>,
) {
  if (input.text !== undefined || input.kind !== undefined || input.color !== undefined) {
    return false;
  }
  if (input.checklist !== undefined) {
    if (existing.text !== next.text) return false;
    if (existing.kind !== next.kind) return false;
    if (existing.color !== next.color) return false;
    if (existing.checklist.length !== next.checklist.length) return false;
    return existing.checklist.every((item, index) => {
      const other = next.checklist[index];
      return other
        && item.id === other.id
        && item.text === other.text
        && item.done !== other.done;
    });
  }
  return input.done !== undefined;
}

export async function listOwnerNotebookNotes(
  rawInput: z.infer<typeof actorInputSchema>,
): Promise<{ notes: OwnerNotebookNotePayload[] }> {
  const parsed = actorInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner notebook list input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOwnerNotebookAccess(input);

  const db = getDb();
  const rows = await db
    .select({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
      checklist: ownerNotebookNotes.checklist,
      createdAt: ownerNotebookNotes.createdAt,
      updatedAt: ownerNotebookNotes.updatedAt,
    })
    .from(ownerNotebookNotes)
    .where(
      and(
        eq(ownerNotebookNotes.organizationId, input.organizationId),
        eq(ownerNotebookNotes.userId, input.actorUserId),
      ),
    )
    .orderBy(desc(ownerNotebookNotes.updatedAt), desc(ownerNotebookNotes.id));

  return { notes: rows.map(mapRow) };
}

export async function createOwnerNotebookNote(
  rawInput: z.infer<typeof createNoteInputSchema>,
): Promise<{ note: OwnerNotebookNotePayload }> {
  const parsed = createNoteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner notebook create input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOwnerNotebookAccess(input);

  const kind = input.kind;
  const color = normalizeColor(input.color);
  const checklist = kind === "task" ? normalizeChecklist(input.checklist) : [];
  const done = computeTaskDone(kind, checklist, false);
  const db = getDb();
  const [created] = await db
    .insert(ownerNotebookNotes)
    .values({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      text: input.text.trim(),
      kind,
      done,
      color,
      checklist,
    })
    .returning({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
      checklist: ownerNotebookNotes.checklist,
      createdAt: ownerNotebookNotes.createdAt,
      updatedAt: ownerNotebookNotes.updatedAt,
    });

  return { note: mapRow(created) };
}

export async function updateOwnerNotebookNote(
  rawInput: z.infer<typeof updateNoteInputSchema>,
): Promise<{ note: OwnerNotebookNotePayload }> {
  const parsed = updateNoteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner notebook update input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOwnerNotebookAccess(input);

  const db = getDb();
  const [existing] = await db
    .select({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
      checklist: ownerNotebookNotes.checklist,
      createdAt: ownerNotebookNotes.createdAt,
      updatedAt: ownerNotebookNotes.updatedAt,
    })
    .from(ownerNotebookNotes)
    .where(
      and(
        eq(ownerNotebookNotes.id, input.noteId),
        eq(ownerNotebookNotes.organizationId, input.organizationId),
        eq(ownerNotebookNotes.userId, input.actorUserId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new ValidationError("Owner notebook note was not found.");
  }

  const existingChecklist = existing.kind === "task"
    ? normalizeChecklist(existing.checklist)
    : [];
  const nextKind = input.kind ?? (existing.kind === "task" ? "task" : "note");
  const nextText = input.text !== undefined ? input.text.trim() : existing.text;
  const nextColor = input.color ? normalizeColor(input.color) : normalizeColor(existing.color);
  const nextChecklist = resolveNextChecklist(nextKind, existingChecklist, input.checklist);
  const nextDone = nextKind === "task"
    ? computeTaskDone("task", nextChecklist, input.done ?? existing.done)
    : false;

  if (!hasOwnerNotebookTaskContent(nextKind, nextText, nextChecklist)) {
    throw new ValidationError("Task needs a title or checklist item.");
  }

  const skipUpdatedAt = isOnlyDoneMutation(
    {
      text: existing.text,
      kind: existing.kind,
      done: existing.done,
      color: normalizeColor(existing.color),
      checklist: existingChecklist,
    },
    {
      text: nextText,
      kind: nextKind,
      done: nextDone,
      color: nextColor,
      checklist: nextChecklist,
    },
    input,
  );

  const [updated] = await db
    .update(ownerNotebookNotes)
    .set({
      text: nextText,
      kind: nextKind,
      done: nextDone,
      color: nextColor,
      checklist: nextChecklist,
      ...(skipUpdatedAt ? {} : { updatedAt: new Date() }),
    })
    .where(eq(ownerNotebookNotes.id, input.noteId))
    .returning({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
      checklist: ownerNotebookNotes.checklist,
      createdAt: ownerNotebookNotes.createdAt,
      updatedAt: ownerNotebookNotes.updatedAt,
    });

  return { note: mapRow(updated) };
}

export async function deleteOwnerNotebookNote(
  rawInput: z.infer<typeof deleteNoteInputSchema>,
): Promise<{ deleted: true; noteId: string }> {
  const parsed = deleteNoteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid owner notebook delete input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOwnerNotebookAccess(input);

  const db = getDb();
  const [deleted] = await db
    .delete(ownerNotebookNotes)
    .where(
      and(
        eq(ownerNotebookNotes.id, input.noteId),
        eq(ownerNotebookNotes.organizationId, input.organizationId),
        eq(ownerNotebookNotes.userId, input.actorUserId),
      ),
    )
    .returning({ id: ownerNotebookNotes.id });

  if (!deleted) {
    throw new ValidationError("Owner notebook note was not found.");
  }

  return { deleted: true, noteId: deleted.id };
}

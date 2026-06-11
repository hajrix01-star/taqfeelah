import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { ownerNotebookNotes } from "@/core/db/schema";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";

const DEFAULT_COLOR = "yellow";

const actorInputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

const noteKindSchema = z.enum(["note", "task"]);

const createNoteInputSchema = actorInputSchema.extend({
  text: z.string().trim().min(1),
  kind: noteKindSchema.default("note"),
  color: z.string().trim().min(1).default(DEFAULT_COLOR),
});

const updateNoteInputSchema = actorInputSchema.extend({
  noteId: z.string().uuid(),
  text: z.string().trim().min(1).optional(),
  kind: noteKindSchema.optional(),
  done: z.boolean().optional(),
  color: z.string().trim().min(1).optional(),
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
  createdAt: Date;
  updatedAt: Date;
}): OwnerNotebookNotePayload {
  const kind = row.kind === "task" ? "task" : "note";
  return {
    id: row.id,
    text: row.text,
    kind,
    done: kind === "task" ? row.done : false,
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
  const db = getDb();
  const [created] = await db
    .insert(ownerNotebookNotes)
    .values({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      text: input.text,
      kind,
      done: false,
      color,
    })
    .returning({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
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

  const nextKind = input.kind ?? (existing.kind === "task" ? "task" : "note");
  const nextText = input.text ?? existing.text;
  const nextColor = input.color ? normalizeColor(input.color) : normalizeColor(existing.color);
  const nextDone = nextKind === "task"
    ? (input.done ?? existing.done)
    : false;

  const onlyTogglingDone = input.done !== undefined
    && input.text === undefined
    && input.kind === undefined
    && input.color === undefined;

  const [updated] = await db
    .update(ownerNotebookNotes)
    .set({
      text: nextText,
      kind: nextKind,
      done: nextDone,
      color: nextColor,
      ...(onlyTogglingDone ? {} : { updatedAt: new Date() }),
    })
    .where(eq(ownerNotebookNotes.id, input.noteId))
    .returning({
      id: ownerNotebookNotes.id,
      text: ownerNotebookNotes.text,
      kind: ownerNotebookNotes.kind,
      done: ownerNotebookNotes.done,
      color: ownerNotebookNotes.color,
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

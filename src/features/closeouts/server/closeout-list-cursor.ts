import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";

const cursorPayloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

export type CloseoutListCursor = z.infer<typeof cursorPayloadSchema>;

export function encodeCloseoutListCursor(row: {
  date: string;
  createdAt: Date | string;
  id: string;
}): string {
  const createdAt = row.createdAt instanceof Date
    ? row.createdAt.toISOString()
    : String(row.createdAt);
  const payload = cursorPayloadSchema.parse({
    date: row.date,
    createdAt,
    id: row.id,
  });
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCloseoutListCursor(rawCursor: string): CloseoutListCursor {
  try {
    const decoded = Buffer.from(rawCursor, "base64url").toString("utf8");
    const parsed = cursorPayloadSchema.safeParse(JSON.parse(decoded));
    if (!parsed.success) {
      throw new ValidationError("Invalid closeouts cursor.", parsed.error.flatten());
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Invalid closeouts cursor.");
  }
}

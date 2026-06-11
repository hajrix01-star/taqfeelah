import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { users } from "@/core/db/schema";

export async function resolveUserDisplayName(userId: string): Promise<string> {
  if (!z.string().uuid().safeParse(userId).success) return "";
  const db = getDb();
  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.name?.trim() || "";
}

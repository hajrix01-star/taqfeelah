import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("platform admin grants repository contracts", () => {
  it("validates lookup input requires username or userId", async () => {
    const lookupSchema = z.object({
      username: z.string().trim().min(1).max(120).optional(),
      userId: z.string().uuid().optional(),
    }).refine((value) => Boolean(value.username || value.userId), {
      message: "username or userId is required.",
    });

    expect(lookupSchema.safeParse({}).success).toBe(false);
    expect(lookupSchema.safeParse({ username: "admin" }).success).toBe(true);
    expect(lookupSchema.safeParse({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    }).success).toBe(true);
  });
});

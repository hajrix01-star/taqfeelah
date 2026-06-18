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

  it("validates profile update requires at least one field", () => {
    const updateProfileSchema = z.object({
      name: z.string().trim().min(1).max(120).optional(),
      username: z.string().trim().min(1).max(120).optional(),
      password: z.string().trim().min(4).max(120).optional(),
    }).refine((value) => Boolean(value.name || value.username || value.password), {
      message: "At least one profile field must be provided.",
    });

    expect(updateProfileSchema.safeParse({}).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "Owner" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ password: "secret12" }).success).toBe(true);
  });
});

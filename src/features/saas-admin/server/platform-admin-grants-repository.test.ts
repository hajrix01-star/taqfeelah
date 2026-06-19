import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("platform admin grants repository contracts", () => {
  it("validates lookup input requires email or userId", () => {
    const lookupSchema = z.object({
      username: z.string().trim().email("A valid email address is required.").max(120).optional(),
      userId: z.string().uuid().optional(),
    }).refine((value) => Boolean(value.username || value.userId), {
      message: "email or userId is required.",
    });

    expect(lookupSchema.safeParse({}).success).toBe(false);
    expect(lookupSchema.safeParse({ username: "admin@example.com" }).success).toBe(true);
    expect(lookupSchema.safeParse({ username: "hajri" }).success).toBe(false);
    expect(lookupSchema.safeParse({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    }).success).toBe(true);
  });

  it("validates profile update requires name and email", () => {
    const updateProfileSchema = z.object({
      name: z.string().trim().min(1).max(120),
      username: z.string().trim().email("A valid email address is required.").max(120),
      password: z.string().trim().min(4).max(120).optional(),
    });

    expect(updateProfileSchema.safeParse({}).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "Owner" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({
      name: "Owner",
      username: "owner@example.com",
    }).success).toBe(true);
    expect(updateProfileSchema.safeParse({
      name: "Owner",
      username: "hajri",
    }).success).toBe(false);
  });
});

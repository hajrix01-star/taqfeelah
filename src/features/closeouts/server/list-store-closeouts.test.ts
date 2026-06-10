import { describe, expect, it } from "vitest";
import { mapCloseoutStatus } from "./list-store-closeouts";

describe("mapCloseoutStatus", () => {
  it.each(["approved", "submitted", "returned", "legacy"])("maps %s to reviewed", (status) => {
    expect(mapCloseoutStatus(status)).toBe("reviewed");
  });
});

describe("listStoreCloseouts metadata parsing", () => {
  it("accepts outflow metadata with legacy category labels and coerced amounts", async () => {
    const { z } = await import("zod");
    const outflowRowSchema = z.object({
      type: z.enum(["purchases", "expense", "withdrawal"]),
      amountHalalas: z.coerce.number().int().positive(),
      categoryId: z.string().uuid().nullable().optional(),
      categoryName: z.string().optional(),
      typeLabel: z.string().optional(),
      note: z.string().optional().nullable(),
    });

    const parsed = outflowRowSchema.safeParse({
      type: "expense",
      amountHalalas: "2500",
      categoryName: "صيانة",
      typeLabel: "مصروف",
      note: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.amountHalalas).toBe(2500);
      expect(parsed.data.categoryName).toBe("صيانة");
    }
  });
});

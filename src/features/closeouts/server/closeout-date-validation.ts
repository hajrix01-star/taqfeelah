import { z } from "zod";

export const closeoutDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((date) => date <= new Date().toISOString().slice(0, 10), {
    message: "Closeout date cannot be in the future.",
  });

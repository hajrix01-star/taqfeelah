import { z } from "zod";
import { isCloseoutSubmitDateAllowed } from "@/features/closeouts/closeout-submit-date";

export const closeoutDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((date) => isCloseoutSubmitDateAllowed(date), {
    message: "Closeout date cannot be in the future.",
  });

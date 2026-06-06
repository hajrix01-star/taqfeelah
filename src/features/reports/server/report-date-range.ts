import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM");

export const MAX_REPORT_RANGE_DAYS = 366;

export function monthToDateRange(month: string): { from: string; to: string } {
  const parsed = monthSchema.safeParse(month);
  if (!parsed.success) {
    throw new ValidationError("month must be YYYY-MM.");
  }
  const [yearText, monthText] = parsed.data.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 1 || monthIndex > 12) {
    throw new ValidationError("month must be a valid calendar month.");
  }
  const from = `${yearText}-${monthText}-01`;
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const to = `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function assertBoundedReportRange(from: string, to: string) {
  const parsedFrom = dateSchema.safeParse(from);
  const parsedTo = dateSchema.safeParse(to);
  if (!parsedFrom.success || !parsedTo.success) {
    throw new ValidationError("from and to must be YYYY-MM-DD.");
  }
  if (parsedFrom.data > parsedTo.data) {
    throw new ValidationError("from must be earlier than or equal to to.");
  }
  const start = new Date(`${parsedFrom.data}T12:00:00Z`).getTime();
  const end = new Date(`${parsedTo.data}T12:00:00Z`).getTime();
  const dayCount = Math.floor((end - start) / 86_400_000) + 1;
  if (dayCount > MAX_REPORT_RANGE_DAYS) {
    throw new ValidationError(`Report range cannot exceed ${MAX_REPORT_RANGE_DAYS} days.`);
  }
  return { from: parsedFrom.data, to: parsedTo.data };
}

import { and, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";

type DbExecutor = Pick<ReturnType<typeof getDb>, "select">;

export async function ensureEmployeeLoginPhoneAvailable(
  input: {
    phone: string;
    excludeUserId: string | null;
  },
  executor: DbExecutor,
) {
  const [existing] = await executor
    .select({
      id: authIdentities.id,
      userId: authIdentities.userId,
    })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "employee_pin"),
        eq(authIdentities.loginPhone, input.phone),
      ),
    )
    .limit(1);

  if (!existing?.id) return;
  if (input.excludeUserId && existing.userId === input.excludeUserId) return;

  throw catalogAppError(ERROR_CODES.EMPLOYEE_PHONE_TAKEN);
}

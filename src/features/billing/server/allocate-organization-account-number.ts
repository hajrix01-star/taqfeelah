import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/core/db/schema";

type DbExecutor = Pick<NodePgDatabase<typeof schema>, "execute">;

export async function allocateOrganizationAccountNumber(executor: DbExecutor): Promise<number> {
  const result = await executor.execute(
    sql`SELECT nextval('organization_account_number_seq')::int AS account_number`,
  );
  const row = result.rows[0] as { account_number?: number | string } | undefined;
  const accountNumber = Number(row?.account_number);
  if (!Number.isInteger(accountNumber) || accountNumber <= 0) {
    throw new Error("Failed to allocate organization account number.");
  }
  return accountNumber;
}

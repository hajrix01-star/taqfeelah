import process from "node:process";
import { aggregateSaasAnalytics } from "../src/features/saas-admin/server/aggregate-saas-analytics";

async function main() {
  const snapshotDate = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2])
    ? process.argv[2]
    : undefined;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const result = await aggregateSaasAnalytics(snapshotDate);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

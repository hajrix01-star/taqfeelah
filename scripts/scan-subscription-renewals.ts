import process from "node:process";
import { scanSubscriptionRenewals } from "../src/features/billing/server/scan-subscription-renewals";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const result = await scanSubscriptionRenewals();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { ok } from "@/core/http/api-response";
import { getReleaseMeta } from "@/release/version";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(getReleaseMeta());
}

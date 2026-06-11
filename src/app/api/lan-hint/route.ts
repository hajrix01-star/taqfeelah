import { buildLanPageUrls } from "../../../../scripts/lan-hosts.mjs";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { getReleaseMeta } from "@/release/version";

export const dynamic = "force-dynamic";

export async function GET() {
  const port = Number(process.env.PORT) || 3000;
  const urls = buildLanPageUrls(port, "/app", PROTOTYPE_BUILD_STAMP);
  return Response.json({
    build: PROTOTYPE_BUILD_STAMP,
    release: getReleaseMeta(),
    urls,
    port,
  });
}

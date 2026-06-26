import { buildLanPageUrls } from "../../../../scripts/lan-hosts.mjs";
import { APP_BUILD_STAMP } from "@/app-build-stamp.mjs";
import { getReleaseMeta } from "@/release/version";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const port = Number(process.env.PORT) || 3000;
  const urls = buildLanPageUrls(port, "/app", APP_BUILD_STAMP);
  return Response.json({
    build: APP_BUILD_STAMP,
    release: getReleaseMeta(),
    urls,
    port,
  });
}

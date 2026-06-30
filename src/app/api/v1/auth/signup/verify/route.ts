import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { confirmPublicSignup } from "@/features/signup/server/confirm-public-signup";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  const token = typeof body?.token === "string" ? body.token : "";
  return confirmPublicSignup({ token }, request);
});

export const GET = withApiRouteNoParams(({ request, searchParams }) => {
  const token = searchParams.get("token")?.trim() || "";
  return confirmPublicSignup({ token }, request);
});

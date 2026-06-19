import { failRequest, ok } from "@/core/http/api-response";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { confirmPublicSignup } from "@/features/signup/server/confirm-public-signup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const result = await confirmPublicSignup({ token }, request);
    return ok(result);
  } catch (error) {
    return failRequest(error, request);
  }
}

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const token = new URL(request.url).searchParams.get("token")?.trim() || "";
    const result = await confirmPublicSignup({ token }, request);
    return ok(result);
  } catch (error) {
    return failRequest(error, request);
  }
}

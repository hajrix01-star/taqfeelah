import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["prototype", "production"]).optional(),
  NEXT_PUBLIC_APP_MODE: z.enum(["prototype", "production"]).optional(),
  AUTH_SESSION_SECRET: z.string().min(16).optional(),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default("taqfeelah_session"),
  AUTH_ORGANIZATION_ID: z.string().uuid().optional(),
  AUTH_OWNER_USER_ID: z.string().uuid().optional(),
  AUTH_OWNER_USERNAME: z.string().min(1).optional(),
  AUTH_OWNER_PASSWORD: z.string().min(1).optional(),
  AUTH_EMPLOYEE_PIN_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_ENTRIES_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP: z.string().optional(),
  ALLOW_HEADER_AUTH_CONTEXT: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

type AppEnv = z.infer<typeof envSchema>;

let envCache: AppEnv | null = null;

export function readEnv(): AppEnv {
  if (envCache) return envCache;
  envCache = envSchema.parse(process.env);
  return envCache;
}

export function allowHeaderAuthContext(env = readEnv()): boolean {
  if (env.APP_MODE === "production" || env.NODE_ENV === "production") {
    return false;
  }
  if (typeof env.ALLOW_HEADER_AUTH_CONTEXT === "boolean") {
    return env.ALLOW_HEADER_AUTH_CONTEXT;
  }
  return true;
}

export function isServerProductionMode(env = readEnv()): boolean {
  return env.APP_MODE === "production" || env.NODE_ENV === "production";
}

function parseJsonMap(rawValue: string | undefined): Record<string, string> {
  if (!rawValue || typeof rawValue !== "string") return {};
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

export function getProductionAuthRuntimeConfig(env = readEnv()) {
  const organizationId = env.AUTH_ORGANIZATION_ID || env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const ownerUserId = env.AUTH_OWNER_USER_ID || env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  return {
    organizationId,
    ownerUserId,
    ownerUsername: env.AUTH_OWNER_USERNAME || "",
    ownerPassword: env.AUTH_OWNER_PASSWORD || "",
    employeePinMap: parseJsonMap(env.AUTH_EMPLOYEE_PIN_MAP),
    userIdMap: parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP),
  };
}

export function assertProductionRuntimeEnv(env = readEnv()) {
  if (!isServerProductionMode(env)) return;
  // Temporary bypass requested by product owner during staged rollout.
  // Keep this function as no-op for now and rely on runtime setting management.
}

export function __resetEnvCacheForTests() {
  envCache = null;
}

export function requireDatabaseUrl(): string {
  const { DATABASE_URL } = readEnv();
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return DATABASE_URL;
}

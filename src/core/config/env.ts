import { z } from "zod";
import { buildSalesChannelIdMap } from "@/core/client/sales-channel-catalog";
import { ServiceUnavailableError } from "@/core/errors/app-error";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["local", "production"]).optional(),
  NEXT_PUBLIC_APP_MODE: z.enum(["local", "production"]).optional(),
  AUTH_SESSION_SECRET: z.string().min(16).optional(),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default("taqfeelah_session"),
  AUTH_ORGANIZATION_ID: z.string().uuid().optional(),
  AUTH_OWNER_USER_ID: z.string().uuid().optional(),
  AUTH_OWNER_USERNAME: z.string().min(1).optional(),
  AUTH_OWNER_PASSWORD: z.string().min(1).optional(),
  AUTH_EMPLOYEE_PIN_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_ENTRIES_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_PHASE9_API_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP: z.string().optional(),
  NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP: z.string().optional(),
  ALLOW_HEADER_AUTH_CONTEXT: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: z.enum(["true", "false"]).optional(),
  AUTH_DB_CREDENTIALS_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_AUTH_API_ENABLED: z.enum(["true", "false"]).optional(),
  SAAS_PLATFORM_ADMIN_USER_IDS: z.string().optional(),
  SAAS_ADMIN_API_ENABLED: z.enum(["true", "false"]).optional(),
  USAGE_TRACKING_ENABLED: z.enum(["true", "false"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  ATTACHMENT_STORAGE_MODE: z.enum(["inline", "local"]).optional(),
  ATTACHMENT_STORAGE_ROOT: z.string().min(1).optional(),
  APP_PUBLIC_ORIGIN: z.string().url().optional(),
  NEXT_PUBLIC_APP_ORIGIN: z.string().url().optional(),
  AUTH_PASSWORD_RESET_ENABLED: z.enum(["true", "false"]).optional(),
  AUTH_PUBLIC_SIGNUP_ENABLED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED: z.enum(["true", "false"]).optional(),
  AUTH_SIGNUP_SYSTEM_ACTOR_USER_ID: z.string().uuid().optional(),
  AUTH_EMAIL_FROM: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  AUTH_RATE_LIMIT_REDIS_REQUIRED: z.enum(["true", "false"]).optional(),
  AUTH_SESSION_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

type AppEnv = z.infer<typeof envSchema>;

let envCache: AppEnv | null = null;

export function readEnv(): AppEnv {
  if (envCache) return envCache;
  envCache = envSchema.parse(process.env);
  return envCache;
}

export function allowHeaderAuthContext(env = readEnv()): boolean {
  return env.ALLOW_HEADER_AUTH_CONTEXT === "true";
}

export function isServerProductionMode(env = readEnv()): boolean {
  return env.APP_MODE === "production" || env.NODE_ENV === "production";
}

/** When unset, Secure cookies follow production mode (HTTPS). Set false for local/CI HTTP E2E. */
export function isAuthSessionCookieSecure(env = readEnv()): boolean {
  if (env.AUTH_SESSION_COOKIE_SECURE === "true") return true;
  if (env.AUTH_SESSION_COOKIE_SECURE === "false") return false;
  return isServerProductionMode(env);
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
  const authDbCredentialsEnabled = env.AUTH_DB_CREDENTIALS_ENABLED === "true";
  const stripLegacyPasswordFallback = isServerProductionMode(env) && authDbCredentialsEnabled;
  return {
    organizationId,
    ownerUserId,
    ownerUsername: env.AUTH_OWNER_USERNAME || "",
    ownerPassword: stripLegacyPasswordFallback ? "" : (env.AUTH_OWNER_PASSWORD || ""),
    employeePinMap: parseJsonMap(env.AUTH_EMPLOYEE_PIN_MAP),
    userIdMap: parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP),
    storeIdMap: parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP),
    salesChannelIdMap: buildSalesChannelIdMap({
      envSalesChannelIdMap: parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP),
    }),
  };
}

export function assertProductionRuntimeEnv(env = readEnv()) {
  if (!isServerProductionMode(env)) return;

  const missing: string[] = [];
  const authApiEnabled = env.NEXT_PUBLIC_AUTH_API_ENABLED === "true";
  const authDbCredentialsEnabled = env.AUTH_DB_CREDENTIALS_ENABLED === "true";
  const authLaunchRequested = authApiEnabled || authDbCredentialsEnabled;

  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if ((env.APP_MODE || "local") !== "production") {
    missing.push("APP_MODE=production");
  }
  if ((env.NEXT_PUBLIC_APP_MODE || "local") !== "production") {
    missing.push("NEXT_PUBLIC_APP_MODE=production");
  }
  if (env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED !== "true") {
    missing.push("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true");
  }
  if (env.NEXT_PUBLIC_ENTRIES_API_ENABLED !== "true") {
    missing.push("NEXT_PUBLIC_ENTRIES_API_ENABLED=true");
  }
  if (env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED !== "true") {
    missing.push("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true");
  }
  if (env.NEXT_PUBLIC_PHASE9_API_ENABLED !== "true") {
    missing.push("NEXT_PUBLIC_PHASE9_API_ENABLED=true");
  }
  if (env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED !== "true") {
    missing.push("NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true");
  }
  if (env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE !== "true") {
    missing.push("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true");
  }

  const authCfg = getProductionAuthRuntimeConfig(env);
  if (!authCfg.organizationId) {
    missing.push("AUTH_ORGANIZATION_ID or NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID");
  }
  if (!authCfg.ownerUserId) {
    missing.push("AUTH_OWNER_USER_ID or NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID");
  }

  const requiresLegacyEnvIdMaps = env.ALLOW_HEADER_AUTH_CONTEXT === "true";

  if (requiresLegacyEnvIdMaps) {
    if (Object.keys(authCfg.userIdMap).length === 0) {
      missing.push("NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP");
    }
    if (Object.keys(parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP)).length === 0) {
      missing.push("NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP");
    }
    if (Object.keys(parseJsonMap(env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP)).length === 0) {
      missing.push("NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP");
    }
  }
  if (authLaunchRequested && (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16)) {
    missing.push("AUTH_SESSION_SECRET(min 16 chars) (only when launching auth)");
  }
  if (authLaunchRequested && !authApiEnabled) {
    missing.push("NEXT_PUBLIC_AUTH_API_ENABLED=true (only when launching auth)");
  }
  if (authLaunchRequested && !authDbCredentialsEnabled) {
    missing.push("AUTH_DB_CREDENTIALS_ENABLED=true (only when launching auth)");
  }
  if (env.ALLOW_HEADER_AUTH_CONTEXT === "true") {
    missing.push("ALLOW_HEADER_AUTH_CONTEXT=false (header auth is disabled in production)");
  }

  if (env.AUTH_RATE_LIMIT_REDIS_REQUIRED === "true") {
    if (!env.UPSTASH_REDIS_REST_URL?.trim()) {
      missing.push("UPSTASH_REDIS_REST_URL (required when AUTH_RATE_LIMIT_REDIS_REQUIRED=true)");
    }
    if (!env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
      missing.push("UPSTASH_REDIS_REST_TOKEN (required when AUTH_RATE_LIMIT_REDIS_REQUIRED=true)");
    }
  }

  if (missing.length > 0) {
    throw new ServiceUnavailableError(
      `Production runtime env is incomplete: ${missing.join(", ")}`,
    );
  }
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

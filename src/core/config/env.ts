import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["prototype", "production"]).optional(),
  AUTH_SESSION_SECRET: z.string().min(16).optional(),
  AUTH_SESSION_COOKIE_NAME: z.string().min(1).default("taqfeelah_session"),
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

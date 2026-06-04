import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type AppEnv = z.infer<typeof envSchema>;

let envCache: AppEnv | null = null;

export function readEnv(): AppEnv {
  if (envCache) return envCache;
  envCache = envSchema.parse(process.env);
  return envCache;
}

export function requireDatabaseUrl(): string {
  const { DATABASE_URL } = readEnv();
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return DATABASE_URL;
}

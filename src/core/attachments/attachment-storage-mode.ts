import { readEnv } from "@/core/config/env";

export type AttachmentStorageMode = "inline" | "local";

const DEFAULT_VPS_STORAGE_ROOT = "/var/lib/taqfeelah/attachments";
const DEFAULT_DEV_STORAGE_ROOT = "data/attachments";

let modeCache: AttachmentStorageMode | null = null;
let rootCache: string | null = null;

export function __resetAttachmentStorageConfigForTests() {
  modeCache = null;
  rootCache = null;
}

function resolveDefaultMode(): AttachmentStorageMode {
  const env = readEnv();
  if (env.NODE_ENV === "test") return "inline";
  if (env.APP_MODE === "production" || env.NODE_ENV === "production") return "local";
  return "local";
}

export function readAttachmentStorageMode(): AttachmentStorageMode {
  if (modeCache) return modeCache;

  const raw = process.env.ATTACHMENT_STORAGE_MODE?.trim().toLowerCase();
  if (raw === "inline" || raw === "local") {
    modeCache = raw;
    return modeCache;
  }

  modeCache = resolveDefaultMode();
  return modeCache;
}

export function readAttachmentStorageRoot(): string {
  if (rootCache) return rootCache;

  const configured = process.env.ATTACHMENT_STORAGE_ROOT?.trim();
  if (configured) {
    rootCache = configured;
    return rootCache;
  }

  const env = readEnv();
  rootCache = env.NODE_ENV === "production" || env.APP_MODE === "production"
    ? DEFAULT_VPS_STORAGE_ROOT
    : DEFAULT_DEV_STORAGE_ROOT;
  return rootCache;
}

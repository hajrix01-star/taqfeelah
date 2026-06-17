import type { ComponentType } from "react";

export const APP_RUNTIME_LOAD_MAX_ATTEMPTS = 3;
export const APP_RUNTIME_LOAD_RETRY_MS = 400;

export type TaqfeelahPrototypeRuntimeModule = {
  default: ComponentType | undefined;
};

export type LoadTaqfeelahPrototypeRuntimeOptions = {
  importRuntime?: () => Promise<TaqfeelahPrototypeRuntimeModule>;
  maxAttempts?: number;
  retryDelayMs?: number;
  wait?: (ms: number) => Promise<void>;
};

async function defaultWait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function loadTaqfeelahPrototypeRuntime(
  options: LoadTaqfeelahPrototypeRuntimeOptions = {},
): Promise<ComponentType> {
  const {
    importRuntime = () => import("@/components/TaqfeelahPrototypeRuntime"),
    maxAttempts = APP_RUNTIME_LOAD_MAX_ATTEMPTS,
    retryDelayMs = APP_RUNTIME_LOAD_RETRY_MS,
    wait = defaultWait,
  } = options;

  let lastError: unknown = new Error("runtime-load-failed");

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const mod = await importRuntime();
      if (!mod.default) {
        throw new Error("runtime-module-missing");
      }
      return mod.default;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(retryDelayMs);
      }
    }
  }

  throw lastError;
}

#!/usr/bin/env node
/**
 * Package a CI-built app tree for VPS deploy (includes .next, excludes node_modules).
 * Requires `pnpm build` to have completed successfully first.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const outputName = process.argv[2] || "taqfeelah-production-artifact.tar.gz";

if (!existsSync(".next/BUILD_ID")) {
  console.error("Missing .next/BUILD_ID — run pnpm build before packaging.");
  process.exit(1);
}

const result = spawnSync(
  "tar",
  [
    "-czf",
    outputName,
    "--exclude=node_modules",
    "--exclude=.git",
    "--exclude=.next/cache",
    `--exclude=${outputName}`,
    ".",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Production artifact ready: ${outputName}`);

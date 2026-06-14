#!/usr/bin/env node
/**
 * Package a CI-built app tree for VPS deploy (includes .next, excludes node_modules).
 * Requires `pnpm build` to have completed successfully first.
 *
 * Uses a staging directory so tar does not fail when build outputs change during read.
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputName = process.argv[2] || "taqfeelah-production-artifact.tar.gz";

if (!existsSync(".next/BUILD_ID")) {
  console.error("Missing .next/BUILD_ID — run pnpm build before packaging.");
  process.exit(1);
}

const stageDir = mkdtempSync(join(tmpdir(), "taqfeelah-artifact-"));

try {
  const copy = spawnSync(
    "rsync",
    [
      "-a",
      "--exclude=node_modules",
      "--exclude=.git",
      "--exclude=.next/cache",
      `--exclude=${outputName}`,
      "./",
      `${stageDir}/`,
    ],
    { stdio: "inherit" },
  );
  if (copy.status !== 0) {
    process.exit(copy.status ?? 1);
  }

  const archive = spawnSync("tar", ["-czf", outputName, "-C", stageDir, "."], {
    stdio: "inherit",
  });
  if (archive.status !== 0) {
    process.exit(archive.status ?? 1);
  }
} finally {
  rmSync(stageDir, { recursive: true, force: true });
}

console.log(`Production artifact ready: ${outputName}`);

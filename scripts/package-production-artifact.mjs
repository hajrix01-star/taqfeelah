#!/usr/bin/env node
/**
 * Package a CI-built app tree for VPS deploy (includes .next, excludes node_modules).
 * Requires `pnpm build` to have completed successfully first.
 *
 * Uses a staging directory so tar does not fail when build outputs change during read.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";

const outputName = process.argv[2] || "taqfeelah-production-artifact.tar.gz";

if (!existsSync(".next/BUILD_ID")) {
  console.error("Missing .next/BUILD_ID — run pnpm build before packaging.");
  process.exit(1);
}

function readBuildMetadata() {
  try {
    const raw = readFileSync(".next/required-server-files.json", "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.config?.env || {};
  } catch {
    return {};
  }
}

function currentGitHead() {
  return spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
}

const expectedBuild = process.env.RELEASE_BUILD?.trim()
  || process.env.NEXT_PUBLIC_RELEASE_BUILD?.trim()
  || currentGitHead();
const builtEnv = readBuildMetadata();
const builtBuild = String(builtEnv.RELEASE_BUILD || builtEnv.NEXT_PUBLIC_RELEASE_BUILD || "").trim();

if (!expectedBuild || !builtBuild || builtBuild !== expectedBuild) {
  console.error([
    "Refusing to package a stale Next.js build.",
    `Expected RELEASE_BUILD: ${expectedBuild || "(missing)"}`,
    `Built RELEASE_BUILD: ${builtBuild || "(missing)"}`,
    "Re-run the production build after the final commit with RELEASE_BUILD set to git HEAD.",
  ].join("\n"));
  process.exit(1);
}

const stageDir = mkdtempSync(join(tmpdir(), "taqfeelah-artifact-"));

const excludedRoots = new Set([
  ".codex-local",
  ".git",
  ".turbo",
  "coverage",
  "node_modules",
]);

function normalizePath(value) {
  return value.split(sep).join("/");
}

function shouldCopy(sourcePath) {
  const relativePath = normalizePath(relative(process.cwd(), sourcePath));
  if (!relativePath) {
    return true;
  }

  const [root] = relativePath.split("/");
  if (excludedRoots.has(root)) {
    return false;
  }

  if (relativePath === ".next/cache" || relativePath.startsWith(".next/cache/")) {
    return false;
  }

  if (
    relativePath === outputName ||
    relativePath === basename(outputName) ||
    relativePath.endsWith(".tar.gz")
  ) {
    return false;
  }

  return true;
}

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
    if (copy.error?.code !== "ENOENT") {
      process.exit(copy.status ?? 1);
    }

    console.log("rsync is not available; using Node copy fallback.");
    cpSync(process.cwd(), stageDir, {
      recursive: true,
      dereference: false,
      filter: shouldCopy,
    });
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

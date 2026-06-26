#!/usr/bin/env node
/**
 * Fail CI build if client bundles still embed the legacy non-production support number
 * or omit the production support line after build.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PRODUCTION_SUPPORT_WHATSAPP = "966533507223";
const LEGACY_NON_PRODUCTION_SUPPORT_WHATSAPP = "966501234567";
const CHUNKS_DIR = ".next/static/chunks";

function walkJsFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkJsFiles(fullPath, files);
      continue;
    }
    if (entry.endsWith(".js")) files.push(fullPath);
  }
  return files;
}

if (!existsSync(".next/BUILD_ID")) {
  console.error("Missing .next/BUILD_ID — run pnpm build first.");
  process.exit(1);
}

const files = walkJsFiles(CHUNKS_DIR);
let legacyHits = 0;
let productionHits = 0;
const legacyFiles = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  if (content.includes(LEGACY_NON_PRODUCTION_SUPPORT_WHATSAPP)) {
    legacyHits += 1;
    legacyFiles.push(file);
  }
  if (content.includes(PRODUCTION_SUPPORT_WHATSAPP)) {
    productionHits += 1;
  }
}

if (legacyHits > 0) {
  console.error(
    `Support WhatsApp guard failed: legacy non-production number ${LEGACY_NON_PRODUCTION_SUPPORT_WHATSAPP} found in ${legacyHits} chunk(s).`,
  );
  for (const file of legacyFiles.slice(0, 5)) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

if (productionHits === 0) {
  console.error(
    `Support WhatsApp guard failed: production number ${PRODUCTION_SUPPORT_WHATSAPP} not found in any client chunk.`,
  );
  process.exit(1);
}

console.log(
  `Support WhatsApp guard passed: ${PRODUCTION_SUPPORT_WHATSAPP} present in client bundles; legacy non-production number absent.`,
);

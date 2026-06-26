#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const roots = [
  ".github",
  ".env.example",
  "README.md",
  "docs",
  "scripts",
  "src",
];

const ignoredPathParts = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
]);

const ignoredRelativePrefixes = [
  "docs/archive/",
];

const ignoredFileSuffixes = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".map",
  ".tar.gz",
];

const ignoredTestPatterns = [
  ".test.",
  ".spec.",
  "__tests__/",
  "test-fixtures/",
];

const forbiddenPatterns = [
  {
    label: "old demo/prototype route or runtime namespace",
    pattern: /\bfeatures\/demo\b|\bprototype-runtime\b|\bAppRuntimePage\b|\bTaqfeelahPrototype\b/i,
  },
  {
    label: "old demo/prototype public env variable",
    pattern: /\bNEXT_PUBLIC_(?:DEMO|PROTOTYPE)_[A-Z0-9_]*\b/,
  },
  {
    label: "old prototype access mode",
    pattern: /\bPROTOTYPE_ACCESS_MODE\b|\bNEXT_PUBLIC_PROTOTYPE_ACCESS_MODE\b/,
  },
  {
    label: "old demo staff catalog filename",
    pattern: /\bdemo-staff-catalog-data\.json\b/i,
  },
  {
    label: "old app reference data filename",
    pattern: /\btaqfeelah-app-reference-data\b/i,
  },
  {
    label: "old root reference asset path",
    pattern: /\breference\/employee-daily-closeouts-ui-reference\.html\b/i,
  },
  {
    label: "mojibake or replacement characters",
    pattern: /\uFFFD|\u00E2|\u00EF|(?:\u0638[\u2020\u201E])|(?:\u0637[\u00B3\u00AE\u00A9])/,
  },
];

function normalizePath(value) {
  return value.split(sep).join("/");
}

function isIgnoredRelativePath(relativePath) {
  const normalized = normalizePath(relativePath);

  if (ignoredRelativePrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  if (ignoredFileSuffixes.some((suffix) => normalized.endsWith(suffix))) {
    return true;
  }

  if (ignoredTestPatterns.some((marker) => normalized.includes(marker))) {
    return true;
  }

  return normalized.split("/").some((part) => ignoredPathParts.has(part));
}

function collectFiles(targetPath, files = []) {
  const relativePath = normalizePath(relative(process.cwd(), targetPath));
  if (relativePath && isIgnoredRelativePath(relativePath)) {
    return files;
  }

  const stats = statSync(targetPath);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(targetPath)) {
      collectFiles(join(targetPath, entry), files);
    }
    return files;
  }

  if (stats.isFile()) {
    files.push(targetPath);
  }
  return files;
}

const files = roots.flatMap((root) => {
  if (!existsSync(root)) {
    return [];
  }
  return collectFiles(root);
});

const failures = [];

for (const file of files) {
  const relativePath = normalizePath(relative(process.cwd(), file));
  const content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  for (const { label, pattern } of forbiddenPatterns) {
    for (let index = 0; index < lines.length; index += 1) {
      if (pattern.test(lines[index])) {
        failures.push({
          file: relativePath,
          line: index + 1,
          label,
          text: lines[index].trim().slice(0, 180),
        });
        break;
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Clean surface guard failed. Active app/docs still contain removed demo/prototype residue or mojibake.");
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} [${failure.label}] ${failure.text}`);
  }
  process.exit(1);
}

console.log(`Clean surface guard passed (${files.length} active files scanned).`);

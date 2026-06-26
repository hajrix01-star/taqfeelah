import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scannedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md"]);
const mojibakeMarkers = [
  "\u00e2",
  "\u20ac",
  "\u0623\u00a2",
  "\u0622\u00a9",
  "\u0637\u00b7",
  "\u0637\u00b8",
  "\u0637\u00a2",
  "\u0637\u00a3",
  "\u0637\u00a5",
  "\u0638\u2020",
  "\u0638\u0679",
  "\u0638\u201e",
  "\u0638\u00be",
  "\u0638\u02c6",
];

function collectSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    const extension = path.slice(path.lastIndexOf("."));
    return scannedExtensions.has(extension) ? [path] : [];
  });
}

describe("source text encoding", () => {
  it("does not contain known mojibake markers", () => {
    const filesWithMojibake = collectSourceFiles("src").filter((file) => {
      const text = readFileSync(file, "utf8");
      return mojibakeMarkers.some((marker) => text.includes(marker));
    });

    expect(filesWithMojibake).toEqual([]);
  });
});

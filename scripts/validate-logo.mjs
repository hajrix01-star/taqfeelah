import fs from "node:fs";

const mod = fs.readFileSync("src/lib/brand/taqfeelah-logo.ts", "utf8");
const match = mod.match(/data:([^;]+);base64,([A-Za-z0-9+/=]+)/);
if (!match) {
  console.error("FAILED: could not parse logo module");
  process.exit(1);
}
const [, mime, b64] = match;
const bytes = Buffer.from(b64, "base64");
console.log("mime:", mime);
console.log("base64 chars:", b64.length);
console.log("decoded bytes:", bytes.length);
console.log("magic:", bytes.slice(0, 4).toString("hex"));
console.log("module file bytes:", fs.statSync("src/lib/brand/taqfeelah-logo.ts").size);

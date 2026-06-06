import fs from "node:fs";
import path from "node:path";

const logoPath = path.join(process.cwd(), "public/brand/taqfeelah-logo.png");
const outPath = path.join(process.cwd(), "src/lib/brand/taqfeelah-logo.ts");
const bytes = fs.readFileSync(logoPath);
const b64 = bytes.toString("base64");
const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : "image/png";

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `export const TAQFEELAH_LOGO_SRC = "data:${mime};base64,${b64}";\n`,
);

console.log(`Wrote ${outPath} (${mime}, ${b64.length} base64 chars)`);

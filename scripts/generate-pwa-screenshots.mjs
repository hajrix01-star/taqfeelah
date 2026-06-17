import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#F8F6F0";
const MUTED = "#827762";
const TAGLINE = "حسبة بدو، لا تعقدها";
const LOGO_PATH = "public/brand/taqfeelah-logo.png";
const OUT_DIR = "public/screenshots";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildBrandCardSvg(width, height) {
  const taglineSize = width >= 900 ? 34 : 26;
  const taglineY = Math.round(height * 0.58);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG}"/>
      <text
        x="${width / 2}"
        y="${taglineY}"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${taglineSize}"
        font-weight="800"
        fill="${MUTED}"
      >${escapeXml(TAGLINE)}</text>
    </svg>
  `);
}

async function writeBrandCard({ width, height, filename }) {
  const logo = sharp(LOGO_PATH);
  const meta = await logo.metadata();
  const logoWidth = Math.round(width * (width >= 900 ? 0.22 : 0.42));
  const logoHeight = Math.round((meta.height / meta.width) * logoWidth);
  const logoBuffer = await logo.resize(logoWidth, logoHeight).png().toBuffer();

  const base = await sharp(buildBrandCardSvg(width, height)).png().toBuffer();
  const left = Math.round((width - logoWidth) / 2);
  const top = Math.round(height * 0.28 - logoHeight / 2);

  await sharp(base)
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

await mkdir(OUT_DIR, { recursive: true });

await writeBrandCard({
  width: 540,
  height: 720,
  filename: "app-narrow.png",
});

await writeBrandCard({
  width: 1280,
  height: 720,
  filename: "app-wide.png",
});

console.log(`Wrote brand install cards in ${OUT_DIR}`);

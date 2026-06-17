import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#F8F6F0";
const MUTED = "#827762";
const TAGLINE = "حسبة بدو، لا تعقدها";
const LOGO_PATH = "public/brand/taqfeelah-logo.png";
const OUT_DIR = "public/icons";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildBrandedIconSvg(size) {
  const taglineSize = Math.max(14, Math.round(size * 0.055));
  const taglineY = Math.round(size * 0.64);
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG}"/>
      <text
        x="${size / 2}"
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

async function makeIcon(size, { maskable = false, filename, includeTagline = false }) {
  const paddingRatio = maskable ? 0.22 : includeTagline ? 0.16 : 0.14;
  const padding = Math.round(size * paddingRatio);
  const maxLogoW = size - padding * 2;
  const maxLogoH = includeTagline ? Math.round(size * 0.34) : size - padding * 2;

  const logo = sharp(LOGO_PATH);
  const meta = await logo.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read logo dimensions");
  }

  const scale = Math.min(maxLogoW / meta.width, maxLogoH / meta.height);
  const logoW = Math.round(meta.width * scale);
  const logoH = Math.round(meta.height * scale);
  const resizedLogo = await logo.resize(logoW, logoH).png().toBuffer();
  const left = Math.round((size - logoW) / 2);
  const top = includeTagline
    ? Math.round(size * 0.24 - logoH / 2)
    : Math.round((size - logoH) / 2);

  const base = includeTagline
    ? await sharp(buildBrandedIconSvg(size)).png().toBuffer()
    : await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG,
      },
    }).png().toBuffer();

  await sharp(base)
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

await mkdir(OUT_DIR, { recursive: true });

const jobs = [
  { size: 180, filename: "icon-180.png", includeTagline: true },
  { size: 192, filename: "icon-192.png", includeTagline: true },
  { size: 192, filename: "icon-maskable-192.png", maskable: true },
  { size: 384, filename: "icon-384.png", includeTagline: true },
  { size: 512, filename: "icon-512.png", includeTagline: true },
  { size: 512, filename: "icon-maskable-512.png", maskable: true },
];

for (const job of jobs) {
  await makeIcon(job.size, job);
  console.log(`Wrote ${path.join(OUT_DIR, job.filename)}`);
}

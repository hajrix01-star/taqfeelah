import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#F8F6F0";
const LOGO_PATH = "public/brand/taqfeelah-logo.png";
const OUT_DIR = "public/icons";

async function makeIcon(size, { maskable = false, filename }) {
  const paddingRatio = maskable ? 0.22 : 0.14;
  const padding = Math.round(size * paddingRatio);
  const maxLogoW = size - padding * 2;
  const maxLogoH = size - padding * 2;

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
  const top = Math.round((size - logoH) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

await mkdir(OUT_DIR, { recursive: true });

const jobs = [
  { size: 180, filename: "icon-180.png" },
  { size: 192, filename: "icon-192.png" },
  { size: 192, filename: "icon-maskable-192.png", maskable: true },
  { size: 384, filename: "icon-384.png" },
  { size: 512, filename: "icon-512.png" },
  { size: 512, filename: "icon-maskable-512.png", maskable: true },
];

for (const job of jobs) {
  await makeIcon(job.size, job);
  console.log(`Wrote ${path.join(OUT_DIR, job.filename)}`);
}

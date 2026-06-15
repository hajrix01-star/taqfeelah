import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#F8F6F0";
const INK = "#112A46";
const GOLD = "#C28A30";
const MUTED = "#827762";
const PAPER = "#FFF0B8";
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

function summaryCard(x, y, width, label, value, valueColor = INK) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="54" rx="16" fill="#FFFFFF" fill-opacity="0.82" stroke="#E8E1D4"/>
      <text x="16" y="22" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${MUTED}">${escapeXml(label)}</text>
      <text x="${width - 16}" y="38" text-anchor="end" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="${valueColor}">${escapeXml(value)}</text>
    </g>
  `;
}

function buildPhoneSvg(width, height) {
  const cardWidth = width - 48;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG}"/>
      <rect x="24" y="24" width="${width - 48}" height="72" rx="22" fill="#FFFFFF" stroke="#E8E1D4"/>
      <text x="${width / 2}" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="${INK}">تقفيلة</text>
      <rect x="24" y="112" width="${width - 48}" height="${height - 136}" rx="24" fill="${PAPER}" stroke="#E8E1D4"/>
      <text x="40" y="150" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="${GOLD}">ملخص اليوم</text>
      <text x="40" y="178" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="${INK}">الداخل − الخارج = الناتج</text>
      ${summaryCard(40, 198, cardWidth, "كاش", "٤٬٢٥٠ ر.س")}
      ${summaryCard(40, 262, cardWidth, "شبكة", "٦٬١٠٠ ر.س")}
      ${summaryCard(40, 326, cardWidth, "خارج", "٢٬١٤٠ ر.س", "#B44747")}
      <rect x="40" y="410" width="${cardWidth}" height="72" rx="18" fill="#112A46"/>
      <text x="${width / 2}" y="442" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">الناتج</text>
      <text x="${width / 2}" y="468" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF">٨٬٢١٠ ر.س</text>
      <rect x="40" y="${height - 88}" width="${(cardWidth - 12) / 3}" height="52" rx="14" fill="#E4B84A"/>
      <rect x="${40 + (cardWidth - 12) / 3 + 6}" y="${height - 88}" width="${(cardWidth - 12) / 3}" height="52" rx="14" fill="#214B7B"/>
      <rect x="${40 + ((cardWidth - 12) / 3 + 6) * 2}" y="${height - 88}" width="${(cardWidth - 12) / 3}" height="52" rx="14" fill="#257844"/>
    </svg>
  `);
}

function buildWideSvg(width, height) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG}"/>
      <rect x="48" y="48" width="420" height="${height - 96}" rx="28" fill="${PAPER}" stroke="#E8E1D4"/>
      <text x="72" y="104" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="${GOLD}">تقفيلة — متابعة تشغيل يومية</text>
      <text x="72" y="142" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${INK}">الداخل − الخارج = الناتج</text>
      ${summaryCard(72, 176, 372, "داخل", "١٢٬١٩٠ ر.س", "#257844")}
      ${summaryCard(72, 244, 372, "خارج", "٢٬٠٤٠ ر.س", "#B44747")}
      ${summaryCard(72, 312, 372, "الناتج", "١٠٬١٥٠ ر.س")}
      <rect x="520" y="48" width="${width - 568}" height="${height - 96}" rx="28" fill="#FFFFFF" stroke="#E8E1D4"/>
      <text x="552" y="104" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="${INK}">السجل والتقفيلات</text>
      <rect x="552" y="132" width="${width - 600}" height="44" rx="12" fill="#E4B84A"/>
      <rect x="552" y="188" width="${width - 600}" height="44" rx="12" fill="#214B7B"/>
      <rect x="552" y="244" width="${width - 600}" height="44" rx="12" fill="#257844"/>
      <text x="572" y="160" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="${INK}">تقرير عام</text>
      <text x="572" y="216" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF">التقفيلات</text>
      <text x="572" y="272" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF">العمليات</text>
      <rect x="552" y="320" width="${width - 600}" height="220" rx="20" fill="#F7F5EF" stroke="#ECE6DA"/>
      <text x="572" y="360" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${MUTED}">متابعة يومية واضحة للمحل</text>
      <text x="572" y="392" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${MUTED}">تقفيلات، عمليات، وملخصات</text>
    </svg>
  `);
}

async function writeScreenshot({ width, filename, svg }) {
  const logo = sharp(LOGO_PATH);
  const meta = await logo.metadata();
  const logoWidth = Math.round(width * 0.18);
  const logoHeight = Math.round((meta.height / meta.width) * logoWidth);
  const logoBuffer = await logo.resize(logoWidth, logoHeight).png().toBuffer();

  const base = await sharp(svg).png().toBuffer();
  const left = Math.round((width - logoWidth) / 2);
  const top = 28;

  await sharp(base)
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toFile(path.join(OUT_DIR, filename));
}

await mkdir(OUT_DIR, { recursive: true });

await writeScreenshot({
  width: 540,
  filename: "app-narrow.png",
  svg: buildPhoneSvg(540, 720),
});

await writeScreenshot({
  width: 1280,
  filename: "app-wide.png",
  svg: buildWideSvg(1280, 720),
});

console.log(`Wrote screenshots in ${OUT_DIR}`);

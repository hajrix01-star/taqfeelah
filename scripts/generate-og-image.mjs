import fs from "node:fs";
import sharp from "sharp";

const logo = fs.readFileSync("public/brand/taqfeelah-logo.png").toString("base64");

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#ECE6DA" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#F8F6F0"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity=".55"/>
  <rect x="56" y="56" width="1088" height="518" rx="36" fill="#FFFDF8" opacity=".94" stroke="#ECE6DA" stroke-width="2"/>
  <image href="data:image/png;base64,${logo}" x="790" y="92" width="230" height="96" preserveAspectRatio="xMidYMid meet"/>
  <text x="760" y="205" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="#D4A843">تشغيل يومي للمحلات</text>
  <text x="760" y="285" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="#112A46">تقفيلة محلك اليومية</text>
  <text x="760" y="356" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#716753">تابع المبيعات والمصروفات والتقارير من الجوال ببساطة</text>
  <g font-family="Arial, sans-serif" font-size="28" font-weight="800">
    <rect x="770" y="435" width="145" height="58" rx="29" fill="#FFF4D2"/>
    <text x="842" y="473" direction="rtl" text-anchor="middle" fill="#806528">مبيعات</text>
    <rect x="600" y="435" width="145" height="58" rx="29" fill="#FFF4D2"/>
    <text x="672" y="473" direction="rtl" text-anchor="middle" fill="#806528">مصروفات</text>
    <rect x="430" y="435" width="145" height="58" rx="29" fill="#FFF4D2"/>
    <text x="502" y="473" direction="rtl" text-anchor="middle" fill="#806528">تقارير</text>
  </g>
  <rect x="160" y="144" width="128" height="128" rx="32" fill="#112A46"/>
  <text x="224" y="230" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="white">تق</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/opengraph-image.png");

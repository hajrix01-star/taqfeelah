import { buildLanPageUrls } from "./lan-hosts.mjs";
import { APP_BUILD_STAMP } from "../src/app-build-stamp.mjs";

const port = Number(process.env.PORT) || 3000;
const path = "/app";
const urls = buildLanPageUrls(port, path, APP_BUILD_STAMP);

console.log("");
console.log("  تقفيلة — روابط الشبكة المحلية (وضع التطوير)");
console.log("  ─────────────────────────────────────────────");
console.log(`  الكمبيوتر:  http://localhost:${port}${path}?b=${APP_BUILD_STAMP}`);
console.log(`  نسخة التطبيق:  ${APP_BUILD_STAMP}  (تحقق منها في مركز المساعدة على الجوال)`);
if (urls.length === 0) {
  console.log("  الجوال:     (لم يُعثر على IP — اتصل بشبكة Wi‑Fi)");
} else {
  urls.forEach((url, index) => {
    const hint = index === 0 ? "  ← استخدم هذا على الجوال" : "";
    console.log(`  الجوال:     ${url}${hint}`);
  });
}
console.log("");
console.log("  • الجوال والكمبيوتر على نفس شبكة الواي‑فاي (ليس ضيف/Guest).");
console.log("  • تطوير:  pnpm dev:clean");
console.log("  • جوال بعد تعديل: افتح الرابط أعلاه من جديد (يحتوي ?b=…) أو احذف اختصار الشاشة الرئيسية");
console.log("  • جوال مستقر:  pnpm preview:lan  ← أعد تشغيله بعد كل تعديل");
console.log("  • إن لم يفتح من الجوال: pnpm firewall:allow  (كمسؤول Windows)");
console.log("");

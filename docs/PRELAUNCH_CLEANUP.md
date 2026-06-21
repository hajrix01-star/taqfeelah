# تنظيف ما قبل الإطلاق — تقفيلة

> **الحالة:** نُفِّذ في دفعة `cursor/prelaunch-cleanup`  
> **السياق:** التطبيق **لم يُطلق بعد**؛ العملاء السابقون على VPS/DB كانوا وهميين (bootstrap dev).

---

## الهدف

إغلاق مسارات التطوير السريع قبل الإطلاق العام:

1. **مسار دخول واحد:** شاشة auth حقيقية (مالك / موظف) — لا «وضع الدخول التجريبي».
2. **مصدر بيانات واحد:** PostgreSQL + جلسات موقعة — لا اعتماد على localStorage كمصدر تشغيلي.
3. **عملاء حقيقيون عبر SaaS Admin فقط** — لا منظمة demo دائمة في الإنتاج.

---

## ما تم حذفه

| البند | الملاحظة |
|-------|----------|
| `TaqfeelahPrototypeReference.tsx` | 3267 سطر مرجعي ميت |
| `PrototypeAccessScreen.jsx` | شاشة «دخول كمالك/موظف» بدون auth |
| `prototype-access-auth-context.js` | سياق env للدخول الوهمي |
| `e2e/prototype-access.smoke.spec.ts` | كان يختبر الشاشة المحذوفة |

---

## ما تم تعطيله نهائيًا

| البند | السلوك الجديد |
|-------|----------------|
| `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` | **أُزيل من العقد والكود** — لا يوجد مسار رجوع تجريبي للإنتاج |
| `enterPrototypeAsOwner/Employee` | حُذف من handlers |
| خرائط ID في `deploy-production.yml` | لم تعد تُمرَّر افتراضيًا |
| `vps_deploy.py` bootstrap | موجة 7 + auth حقيقي بدون maps وهمية |

---

## ما بقي (عمدًا)

| البند | السبب |
|-------|--------|
| `TaqfeelahPrototypeRuntime.jsx` + `prototype-runtime/*` | **الواجهة المعتمدة** (baseline مجمد) |
| `legacyId` في org-config mapper | ربط UI المجمد بـ UUID |
| `scripts/seed-closeouts-foundation.mjs` | **اختياري للتطوير المحلي فقط** |
| Playwright smoke | يختبر شاشة الدخول الحقيقية (بدون DB) |

---

## مسار الإطلاق الموصى به

```text
1. VPS: migrate فقط (drizzle-kit migrate) — بدون seed demo
2. SaaS Admin → حساب جديد → رابط إعداد المالك
3. مالك يكمل الإعداد ويدخل من /app
4. دعوات موظفين من إعدادات المنشأة
```

### تطوير محلي (اختياري)

```bash
pnpm db:migrate
# اختياري — bootstrap واحد للتجربة:
pnpm db:seed:closeouts
pnpm db:seed:auth
pnpm dev
```

---

## الاختبارات

| الأمر | ماذا يغطي |
|-------|-----------|
| `pnpm test` | 779+ وحدة/تكامل (مع mocks) |
| `pnpm smoke:browser` | شاشة `/app` auth + marketing + saas-admin shell |
| `pnpm check:refactor` | lint + typecheck + test + smoke + build |

**فجوة معروفة:** لا يوجد بعد E2E بـ PostgreSQL حقيقي + login كامل — مُخطَّط لدفعة لاحقة.

---

## مراجع محدَّثة

- `docs/PRODUCTION_STATUS.md` — حالة ما قبل الإطلاق
- `docs/FEATURE_FLAGS_MATRIX.md` — أعلام البيئة بعد التنظيف
- `docs/PROTOTYPE_ACCESS_MODE.md` — **مهمل** (تاريخي)
- `.env.example` — قالب الإعداد

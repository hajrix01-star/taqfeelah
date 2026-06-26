# تقفيلة (Taqfeelah)

تقفيلة تطبيق SaaS للتشغيل اليومي المبسط:

```text
المبيعات - الخارج = صافي الحركة
```

التطبيق ليس نظام محاسبة قانوني، ولا ERP، ولا POS. مصدر الحقيقة في الإنتاج هو PostgreSQL عبر API موثقة ومحمية بجلسات وصلاحيات.

## الحالة الحالية

- تطبيق العميل: `/app`
- لوحة إدارة المنصة: `/saas-admin`
- الموقع العام والتسجيل: `/` و`/signup`
- قاعدة البيانات: PostgreSQL + Drizzle ORM
- الإنتاج: من `main` فقط
- staging: من فرع التجربة
- حالة الإنتاج والقرارات المؤجلة: `docs/PRODUCTION_STATUS.md`

لا تدمج إلى `main` ولا تشغل seed/reset على الإنتاج بدون موافقة صريحة وخطة تحقق.

## ابدأ من هنا

اقرأ الوثائق بهذا الترتيب:

1. `docs/README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CONVENTIONS.md`
4. `docs/DATA_SOURCE_UNIFICATION.md`
5. `docs/DATABASE_SCHEMA.md`
6. `docs/API_CONTRACT.md`
7. `docs/PRODUCTION_STATUS.md`
8. `docs/PRELAUNCH_MANUAL_SMOKE.md`

عند التعارض، اتبع الكود الحالي ثم الوثائق المعتمدة في `docs/README.md`. وثائق `docs/archive/` تاريخية فقط.

## تشغيل محلي سريع

المتطلبات:

- Node.js 22 أو أحدث
- pnpm عبر Corepack
- PostgreSQL

```bash
corepack prepare pnpm@9.15.9 --activate
corepack pnpm install --frozen-lockfile
```

انسخ `.env.example` إلى `.env.local` واضبط `DATABASE_URL` و`AUTH_SESSION_SECRET`، ثم:

```bash
corepack pnpm db:migrate
corepack pnpm dev
```

استخدم seed فقط على قاعدة محلية فارغة. لا تستخدم `db:push` أو reset/seed على الإنتاج.

## بوابات الجودة

قبل أي دمج:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

للتغييرات التي تمس قاعدة البيانات أو الدخول:

```bash
corepack pnpm smoke:browser:db
corepack pnpm check:db-source
corepack pnpm prelaunch:check:strict --env-file .env.example
```

نجاح الفحوصات لا يلغي الاختبار اليدوي على staging.

## خريطة المشروع

```text
src/app/          صفحات Next.js ومسارات API
src/components/   تركيب واجهة التطبيق الحالية
src/features/     منطق الميزات client/server/types
src/domain/       قواعد العمل والحسابات المستقلة
src/core/         auth, db, config, money, errors, sync
src/lib/          أدوات واجهة عامة
drizzle/          migrations مرتبة
e2e/              اختبارات المتصفح وقاعدة البيانات
scripts/          تشغيل، تحقق، صيانة، نشر
docs/             العقود والقرارات والتشغيل
```

اتجاه الاعتماد المفضل:

```text
app/components -> features -> domain/core -> PostgreSQL
```

قواعد مختصرة:

- لا تضع قواعد العمل داخل `page.tsx`.
- لا تكرر حسابات المال في الواجهة.
- لا تجعل المتصفح مصدرًا دائمًا لبيانات الإنتاج.
- لا تثق في `organizationId` مرسل من العميل؛ السياق يأتي من الجلسة والصلاحيات.

## مصدر الحقيقة

في الإنتاج:

```text
UI -> validated API -> PostgreSQL
                       + local VPS attachment files
```

- PostgreSQL هو المصدر الدائم للعمليات والإعدادات والحسابات والجلسات.
- المرفقات الجديدة تحفظ كملفات محلية معزولة على VPS، وتحفظ بياناتها الوصفية في PostgreSQL.
- التخزين الخارجي للمرفقات مؤجل إلى حين الحاجة للتوسع.
- التخزين في المتصفح مسموح فقط لتفضيلات UI غير تشغيلية أو للتطوير المحلي.

## الفروع والنشر

- `main`: الإنتاج.
- `codex/*`: تغييرات وتجارب معزولة.
- staging والإنتاج لهما خدمة وقاعدة بيانات وإعدادات مستقلة.
- أي تغيير schema يضيف migration جديدًا ولا يعدل migration سبق نشره.

## قرارات مؤجلة

- Object Storage/CDN للمرفقات.
- Redis مشترك عند تعدد نسخ التطبيق أو ارتفاع ضغط الدخول.
- جداول تجميع إضافية بعد إثبات الحاجة بقياس ضغط.
- خطة backup/restore موثقة قبل التوسع التجاري الجاد.

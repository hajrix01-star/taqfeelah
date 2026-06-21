# تقفيلة (Taqfeelah)

تقفيلة تطبيق SaaS للتشغيل المالي اليومي المبسط:

```text
المبيعات - الخارج = صافي الحركة
```

التطبيق ليس نظام محاسبة قانونيًا أو ERP. مصدر الحقيقة في وضع الإنتاج هو PostgreSQL عبر واجهات API موثقة ومحمية بجلسات وصلاحيات.

## الحالة الحالية

- التطبيق التشغيلي: `/app`
- لوحة إدارة المنصة: `/saas-admin`
- الموقع العام والتسجيل: `/` و`/signup`
- قاعدة البيانات: PostgreSQL + Drizzle ORM
- الإنتاج: يُنشر من `main` فقط عبر `.github/workflows/deploy-production.yml`
- التجربة المعزولة: فرع التجربة عبر `.github/workflows/deploy-staging.yml`
- حالة الجاهزية والقرارات المؤجلة: `docs/PRODUCTION_STATUS.md`

لا تدمج إلى `main` ولا تشغّل أوامر seed/reset على الإنتاج دون موافقة صريحة وخطة تحقق.

## ابدأ من هنا

اقرأ الملفات بهذا الترتيب:

1. `README.md` — التشغيل وخريطة المشروع.
2. `docs/README.md` — فهرس الوثائق وتصنيف المرجع الحالي والتاريخي.
3. `docs/ARCHITECTURE.md` — المعمارية الحالية وتدفق البيانات.
4. `docs/CONVENTIONS.md` — قواعد المنتج والكود الإلزامية.
5. `docs/DATA_SOURCE_UNIFICATION.md` — مصدر الحقيقة والمركزية.
6. `docs/DATABASE_SCHEMA.md` — الجداول والعلاقات والفهارس.
7. `docs/API_CONTRACT.md` — عقود واجهات API.
8. `docs/PRODUCTION_STATUS.md` — المنجز والمخاطر والمؤجل.
9. `docs/PRELAUNCH_MANUAL_SMOKE.md` — اختبار ما قبل الإطلاق.

عند اختلاف وثيقتين، تكون الأولوية للحالة الفعلية في الكود ثم `PRODUCTION_STATUS.md` ثم `ARCHITECTURE.md`. يجب تحديث الوثيقة المخالفة في نفس التغيير.

## تشغيل محلي سريع

المتطلبات:

- Node.js 22 أو أحدث
- pnpm 9.15.9 عبر Corepack
- PostgreSQL

```bash
corepack prepare pnpm@9.15.9 --activate
corepack pnpm install --frozen-lockfile
```

انسخ `.env.example` إلى `.env.local` واضبط `DATABASE_URL` و`AUTH_SESSION_SECRET`. ثم:

```bash
corepack pnpm db:migrate
corepack pnpm dev
```

استخدم seed فقط في قاعدة محلية فارغة. لا تستخدم `db:push` أو أوامر reset/seed على الإنتاج.

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

تُشغّل فحوصات CI وقاعدة PostgreSQL أيضًا على GitHub. نجاح الفحوصات لا يلغي الاختبار اليدوي على staging.

## خريطة المشروع

```text
src/app/          صفحات Next.js ومسارات API فقط
src/features/     ميزات المنتج؛ كل ميزة تجمع client/server/types الخاصة بها
src/domain/       قواعد العمل والحسابات المستقلة عن الواجهة
src/core/         البنية المشتركة: auth, db, config, money, errors, sync
src/components/   تركيب الواجهة الحالية والمكوّنات المشتركة
src/lib/          أدوات واجهة عامة محدودة
drizzle/          migrations مرتبة وغير قابلة لإعادة الكتابة بعد النشر
e2e/              اختبارات المتصفح وقاعدة البيانات
scripts/          تشغيل، تحقق، صيانة ونشر
docs/             العقود والقرارات والتشغيل
```

اتجاه الاعتماد المفضل:

```text
app/components -> features -> domain/core -> PostgreSQL
```

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
- المرفقات الجديدة تحفظ كملفات محلية معزولة على VPS، وتحفظ بياناتها الوصفية ومسارها في PostgreSQL.
- التخزين الخارجي للمرفقات مؤجل إلى ما بعد الإطلاق وعند الحاجة للتوسع، بقرار المالك.
- `localStorage` وIndexedDB مسموحان فقط لسلوك واجهة غير تجاري أو prototype خارج وضع الإنتاج.

## المال وسلامة البيانات

- كل مبلغ إنتاجي يخزن كعدد صحيح بالهللات: `amountHalalas`.
- الحساب المركزي في `src/domain/cash-movement`.
- العمليات متعددة الخطوات تستخدم transaction في PostgreSQL.
- العمليات المالية العادية تستخدم `void` و`restore` مع `audit_events`.
- توجد فجوة موثقة حاليًا في تعديل/حذف التقفيلة؛ راجع `docs/PRODUCTION_STATUS.md` قبل الإطلاق النهائي.

## الفروع والنشر

- `main`: الإنتاج فقط.
- `codex/*`: تغييرات وتجارب معزولة.
- staging والإنتاج لهما خدمة وقاعدة بيانات وإعدادات منفصلة.
- أي تغيير في schema يجب أن يضيف migration جديدًا ولا يعدّل migration سبق نشره.

## القرارات المؤجلة

هذه ليست مهام مطلوبة للإطلاق الأول ما لم تتغير الحاجة:

- Object Storage/CDN للمرفقات — بعد الإطلاق وعند التوسع.
- Redis مشترك — عند تشغيل أكثر من نسخة تطبيق أو زيادة ضغط الدخول.
- جداول تجميع إضافية — بعد إثبات الحاجة باختبار ضغط فعلي.
- النسخ الاحتياطي وخطة الاستعادة — آخر مرحلة قبل اعتماد التشغيل التجاري وفق ترتيب المالك.

التفاصيل والحالة الدقيقة موجودة في `docs/PRODUCTION_STATUS.md`.

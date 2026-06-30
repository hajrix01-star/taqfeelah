# تقفيلة — المعمارية الحالية

> آخر تحديث: 2026-06-26

هذه الوثيقة تصف الوضع الحالي للتطبيق، وليست خطة تاريخية.

## المنتج

تقفيلة تطبيق تشغيل يومي:

```text
المبيعات - الخارج = صافي الحركة
```

ليس نظام محاسبة قانوني، ولا ERP، ولا POS، ولا نظام مخزون أو فواتير أو ضرائب.

## النموذج متعدد المنظمات

```text
Organization
  ├─ Stores
  ├─ Members
  ├─ Member store access
  ├─ Subscriptions
  ├─ Entries
  ├─ Daily closeouts
  └─ Attachments
```

المعرفات الرسمية:

- `organizationId`
- `storeId`
- `userId`
- `salesChannelId`

الخادم يشتق سياق المنظمة من الجلسة والعضوية، ولا يعتمد على body فقط.

## التقنية

| الطبقة | التقنية |
|---|---|
| App | Next.js 15 + React 19 + TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod |
| Tests | Vitest + Playwright |
| PWA | Serwist |
| Logging | Pino |
| Sync | SSE + React Query invalidation |

لا يضاف ORM ثان بجانب Drizzle.

## بنية المستودع

```text
src/app/                  routes + API adapters
src/components/taqfeelah-app/
src/features/             feature-owned client/server logic
src/domain/               pure business rules
src/core/                 auth, db, config, money, errors, sync
src/lib/                  shared UI utilities
```

الاتجاه المعتمد:

```text
route/UI -> feature service -> domain/core -> PostgreSQL
```

## المسارات

| المسار | الغرض |
|---|---|
| `/` | الموقع العام |
| `/signup` | طلب إنشاء حساب مالك |
| `/app` | تطبيق العميل التشغيلي |
| `/saas-admin` | إدارة المنصة والعملاء |
| `/api/v1/*` | واجهات المصادقة والتشغيل والإدارة |

`/app` هو مسار التطبيق التشغيلي الوحيد. لا يوجد route منفصل للتطبيق التجريبي.

## المصادقة والصلاحيات

- الإنتاج يستخدم جلسة موقعة.
- دخول المالك بالجوال/كلمة المرور.
- دخول الموظف بالجوال/PIN.
- `ALLOW_HEADER_AUTH_CONTEXT=false` في الإنتاج.
- صلاحية الوصول للمحل تتحقق في السيرفر من العضوية و`member_store_access`.

## مصدر البيانات

في الإنتاج:

```text
UI memory/cache -> validated API -> PostgreSQL
attachments -> server-managed storage
```

المتصفح ليس مصدرًا دائمًا لبيانات الأعمال. راجع `DATA_SOURCE_UNIFICATION.md`.

## المال والحسابات

المال يخزن ويحسب بالهللات:

```ts
type Money = {
  amountHalalas: number;
  currency: "SAR";
};
```

الحسابات المرجعية في `domain/cash-movement`. الواجهة تعرض الناتج ولا تكون مصدر الحقيقة المالي.

## العمليات والتقفيلات

- إنشاء العملية والتقفيلة وسجل التدقيق يتم داخل transaction.
- الحذف المالي يكون `void` وليس حذفًا فعليًا.
- الاسترجاع يكون `restore`.
- تعديل التقفيلة يحول النسخة السابقة إلى `voided` وينشئ النسخة الجديدة.
- `daySequence` يحدد ترتيب تقفيلات اليوم لنفس المحل.

## المرفقات

جدول `attachments` يحفظ metadata و`storageKey`. الوضع الحالي يستخدم تخزينًا محليًا معزولًا على VPS. النقل إلى object storage خارجي مؤجل إلى حين الحاجة الفعلية.

## الأداء والتوسع

- السجل والتقفيلات يستخدمان pagination.
- التقارير تجمع في SQL ضمن نطاق تاريخ ومحل.
- لا تحمل سنوات كاملة من العمليات إلى المتصفح.
- Redis وobject storage وتشغيل عدة نسخ خطوات توسع لاحقة عند الحاجة.

## النشر

- الإنتاج من `main`.
- staging من فرع التجربة.
- لكل بيئة قاعدة بيانات وخدمة وإعدادات مستقلة.
- الإنتاج يستخدم migrations فقط، بدون seed أو reset.
- `/api/v1/meta` يستخدم للتحقق من الإصدار المنشور.

## قاعدة التغيير

أي تغيير معماري يجب أن:

1. يحافظ على عزل المنظمات.
2. يضيف migration عند تغيير schema.
3. يحدث الاختبارات والوثيقة المتأثرة.
4. يمر عبر lint/typecheck/test/build.
5. ينشر مباشرة إلى الإنتاج بالمسار السريع، ويستخدم staging فقط عند طلب فحص عميق.

# Data Source Unification Policy

> آخر تحديث: 2026-06-26

## القاعدة الأساسية

مصدر الحقيقة في الإنتاج هو PostgreSQL عبر API فقط. الواجهة تعرض وتدخل البيانات، لكنها لا تكون مصدرًا دائمًا للبيانات التشغيلية.

يشمل ذلك:

- العمليات والتقارير والتقفيلات.
- المحلات وقنوات البيع والموظفين والصلاحيات.
- إعدادات المالك التشغيلية المحفوظة في DB.
- المرفقات ومفاتيح التخزين المدارة من السيرفر.
- المصادقة والجلسات.

`localStorage` و`sessionStorage` وIndexedDB ليست مصادر حقيقة في الإنتاج.

## وضع التطبيق الحالي

في `/app` الإنتاجي:

- Auth يعتمد على جلسة موقعة.
- العمليات والتقفيلات والتقارير من API/DB.
- المحلات وقنوات البيع والموظفون من org-config APIs.
- السجل يستخدم pagination عند تفعيل API.
- fallback المحلي ممنوع عندما تكون بيانات السيرفر مطلوبة.
- browser persistence محجوب مركزيًا عند `APP_MODE=production`.

## متطلبات الإنتاج

```bash
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
DATABASE_URL=...
AUTH_SESSION_SECRET=...
NEXT_PUBLIC_AUTH_API_ENABLED=true
AUTH_DB_CREDENTIALS_ENABLED=true
ALLOW_HEADER_AUTH_CONTEXT=false
NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true
NEXT_PUBLIC_ENTRIES_API_ENABLED=true
NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true
NEXT_PUBLIC_PHASE9_API_ENABLED=true
NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true
NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true
```

إذا غابت قيمة مطلوبة، يجب أن يفشل السيرفر بوضوح بدل الرجوع إلى مصدر محلي مضلل.

## سياسة التخزين في المتصفح

يسمح بالتخزين المحلي فقط لبيانات UI غير تشغيلية أو وضع التطوير المحلي. لا يسمح في الإنتاج بتخزين بيانات أعمال دائمة مثل:

- عمليات مالية.
- تقفيلات.
- محلات أو موظفين أو صلاحيات.
- مرفقات.
- بيانات دخول.

الحارس المركزي:

```ts
isBrowserPersistentStorageAllowed()
```

## الهوية canonical

كل الكيانات التشغيلية تستخدم UUID من قاعدة البيانات:

- `organizationId`
- `storeId`
- `userId`
- `salesChannelId`

أي legacy id يبقى للتوافق أو العرض فقط، ولا يستخدم كهوية كتابة في API/DB.

## قاعدة الهجرة الآمنة

لا تحذف بيانات محلية أو legacy تلقائيًا أثناء boot. أي هجرة يجب أن تكون:

1. inventory.
2. backup/export.
3. validation.
4. script idempotent مع dry-run.
5. مقارنة counts/totals.
6. إيقاف fallback بعد إثبات نسخة DB.

## المرفقات

المسار الحالي يستخدم تخزينًا محليًا معزولًا على VPS ومفاتيح تخزين من السيرفر. النقل إلى object storage خارجي مؤجل إلى حين الحاجة الفعلية للتوسع.

## Target Invariant

```text
UI state: memory/cache only
Durable business data: UI -> API -> PostgreSQL
Attachment bytes: UI -> API -> server-managed storage
Production auth: signed session only
No operational fallback in production
```

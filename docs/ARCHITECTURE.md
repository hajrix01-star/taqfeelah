# تقفيلة — المعمارية الحالية

> آخر تحديث: **2026-06-22**
> الحالة: التطبيق التشغيلي والمصادقة ولوحة SaaS وواجهات البيانات منفذة. هذه الوثيقة تصف الواقع الحالي، لا خطة تأسيس مستقبلية.

## 1. نطاق المنتج

تقفيلة تطبيق تشغيل يومي مبسط:

```text
المبيعات - الخارج = صافي الحركة
```

ليس نظام محاسبة قانونيًا، ولا ERP أو POS أو نظام مخزون أو فواتير أو ضرائب. القواعد التفصيلية في `docs/CONVENTIONS.md`.

## 2. النموذج متعدد المنشآت

`Organization` هي وحدة العميل والاشتراك والعزل:

```text
Organization
  ├── Stores
  ├── Members and store access
  ├── Subscription and entitlements
  ├── Entries and daily closeouts
  └── Attachments and audit events
```

المعرفات الرسمية:

| المعرف | المعنى |
|---|---|
| `organizationId` | المنشأة/العميل |
| `storeId` | المحل داخل المنشأة |
| `userId` | المستخدم |

لا يُنشأ اسم موازٍ مثل `tenantId`. الخادم يشتق سياق المنشأة من الجلسة والعضوية، ولا يعتمد على جسم الطلب وحده.

## 3. التقنية

| الطبقة | التقنية الحالية |
|---|---|
| الواجهة والخادم | Next.js 15 + React 19 + TypeScript |
| قاعدة البيانات | PostgreSQL |
| ORM والمهاجرات | Drizzle ORM + drizzle-kit |
| التحقق | Zod |
| اختبارات الوحدة | Vitest |
| اختبارات المتصفح | Playwright |
| السجل | Pino |
| المزامنة | SSE مع تحديث احتياطي من العميل |
| PWA | Serwist |

لا يضاف ORM ثانٍ بجانب Drizzle.

## 4. طبقات المستودع

```text
src/app/          routes + API adapters
src/components/   current UI composition
src/features/     product use-cases grouped by feature
src/domain/       pure business rules and calculations
src/core/         auth, database, money, config, errors, sync
src/lib/          shared UI utilities
```

الاتجاه المفضل:

```text
route/UI -> feature service -> domain/core -> PostgreSQL
```

- `app` يربط الطلب بالخدمة ولا يحتوي قواعد عمل.
- `features` تملك حالة الاستخدام وواجهات client/server الخاصة بها.
- `domain/cash-movement` يملك الحسابات التشغيلية المركزية.
- `core` لا يعتمد على شاشة أو ميزة منتج محددة.

مجلد `components/prototype-runtime` يحمل اسمًا تاريخيًا لكنه يكوّن واجهة `/app` المعتمدة حاليًا. الاسم ليس تصريحًا باستخدام بيانات تجريبية في الإنتاج. تفكيكه وإعادة تسميته يتمان تدريجيًا فقط مع اختبارات تمنع تغيير السلوك.

### تنظيم واجهة إعدادات المالك

واجهة الإعدادات مقسمة حسب المسؤولية، ولا يحتوي ملف التوجيه على تفاصيل الأقسام:

```text
owner-settings-section-views.tsx
  ├── owner-settings-home-section.tsx
  ├── owner-settings-account-section.tsx
  ├── owner-settings-stores-section.tsx
  ├── owner-settings-team-section.tsx
  ├── owner-settings-subscription-section.tsx
  ├── owner-settings-appearance-section.tsx
  └── owner-settings-support-section.tsx
```

`owner-settings-section-frame.tsx` يملك إطار الحركة والمسافات المشترك. اختبار `src/smoke.test.ts` يحمل كل وحدة مباشرة لمنع كسر حدود الاستيراد أثناء التفكيك التدريجي.

## 5. المسارات الفعلية

| المسار | الوظيفة |
|---|---|
| `/` | الموقع العام |
| `/signup` | طلب إنشاء حساب مالك |
| `/app` | التطبيق التشغيلي المحمي |
| `/saas-admin` | إدارة المنصة والعملاء والخطط |
| `/prototype-runtime` | مرجع واجهة خارج مسار الإنتاج الطبيعي |
| `/api/v1/*` | API المصادقة والتشغيل والإدارة والتقارير |

العقد التفصيلي في `docs/API_CONTRACT.md`، والتنفيذ الفعلي في `src/app/api/v1`.

## 6. المصادقة والصلاحيات

- جلسة موقعة في cookie آمن هي السياق الأساسي.
- دخول المالك بالجوال/كلمة المرور، ودخول الموظف بالجوال/PIN.
- `ALLOW_HEADER_AUTH_CONTEXT` للاختبارات المعزولة فقط ويكون `false` في الإنتاج.
- الوصول إلى المتجر يتحقق في الخادم من العضوية والدور.
- تحديد السرعة يستخدم Redis عند ضبط Upstash، أو ذاكرة العملية للنسخة الواحدة.

## 7. مصدر البيانات والمركزية

في الإنتاج:

```text
UI memory/cache -> validated API -> PostgreSQL
                                -> local VPS attachment storage
```

PostgreSQL هو المصدر الدائم للعمليات والتقفيلات والإعدادات والصلاحيات والجلسات. التخزين داخل المتصفح لا يُستخدم كمصدر بيانات إنتاجي. التفاصيل في `docs/DATA_SOURCE_UNIFICATION.md`.

## 8. المال والحساب

```ts
type Money = {
  amountHalalas: number;
  currency: "SAR";
};
```

- التخزين والجمع والطرح بالهللات الصحيحة.
- التحويل إلى الريال للعرض فقط.
- `summary` يمثل المبيعات، و`purchases | expense | withdrawal` تمثل الخارج.
- العمليات الملغاة لا تدخل في الإجماليات.
- الحساب المرجعي في `src/domain/cash-movement` وتتحقق مساواته مع تقارير SQL بالاختبارات.

## 9. دورة العمليات والتقفيلات

- إنشاء عملية وسطور القنوات والمرفقات وسجل التدقيق يتم داخل transaction.
- `void` و`restore` يحافظان على العملية وسجلها.
- التقفيلة تستخدم `clientCloseoutId` لمنع تكرار الطلب نفسه، و`daySequence` لترتيب تقفيلات اليوم.
- تخصيص `daySequence` محمي بقفل transaction على `storeId + date` لمنع تعارض الطلبات المتزامنة.
- تعديل التقفيلة يحوّل عمليات النسخة السابقة إلى `voided` ثم ينشئ النسخة الجديدة داخل transaction واحدة.
- حذف التقفيلة إلغاء منطقي: تصبح التقفيلة وعملياتها `voided` وتبقى الصفوف والمرفقات وسجلات التدقيق محفوظة.
- قيود PostgreSQL المركبة تمنع ربط عملية أو قناة أو مرفق بمتجر/منشأة لا تطابق الأصل المشار إليه.

## 10. المرفقات

- جدول `attachments` يحفظ البيانات الوصفية و`storageKey` فقط.
- وضع الإنتاج الافتراضي يحفظ الملف تحت جذر محلي معزول على VPS (`ATTACHMENT_STORAGE_MODE=local`).
- inline متاح للاختبارات والتوافق مع بيانات قديمة، وليس هدف التوسع.
- نقل الملفات إلى Object Storage/CDN مؤجل بقرار المالك إلى ما بعد الإطلاق وعند التوسع.

## 11. الأداء والتوسع

- فهارس مركبة تبدأ بـ `organizationId` و`storeId`.
- سجل العمليات والتقفيلات يستخدم keyset pagination.
- التقارير تجمع داخل SQL ضمن تاريخ ومتجر محددين.
- لا تُحمّل سنوات من العمليات إلى المتصفح.
- Pool قاعدة البيانات مضبوط لنسخة التطبيق الحالية.
- Redis وObject Storage وتشغيل عدة نسخ وجداول التجميع إجراءات توسع، وليست افتراضات مخفية في الإصدار الأول.

راجع `docs/PERFORMANCE_RULES.md` للحدود وبوابة اختبار الضغط.

## 12. النشر والعزل

- الإنتاج من `main` عبر `deploy-production.yml`.
- staging من فرع التجربة عبر `deploy-staging.yml`.
- لكل بيئة خدمة ومنفذ وقاعدة بيانات وإعدادات مستقلة.
- migrations فقط على الإنتاج؛ لا demo seed ولا reset.
- `/api/v1/meta` يعرض رقم البناء للتحقق بعد النشر.

## 13. قواعد التغيير

أي تغيير معماري يجب أن:

1. يحافظ على عزل المنشآت.
2. يضيف migration جديدًا عند تغيير schema.
3. يحدّث الاختبارات والوثيقة المتأثرة في التغيير نفسه.
4. يمر عبر lint وtypecheck والاختبارات والبناء.
5. يُختبر على staging قبل `main`.

## 14. المراجع

- `README.md`
- `docs/README.md`
- `docs/CONVENTIONS.md`
- `docs/DATA_SOURCE_UNIFICATION.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/API_CONTRACT.md`
- `docs/PERFORMANCE_RULES.md`
- `docs/PRODUCTION_STATUS.md`

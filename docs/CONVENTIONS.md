# تقفيلة — معايير المشروع (إلزامية)

> آخر تحديث: **`APPROVED UI BASELINE`** + وثائق Backend Foundation (2026-06). أي كود أو وثيقة جديدة تلتزم بهذا الملف قبل الدمج.

---

## 0. نطاق المنتج (لا يُناقَش في التنفيذ اليومي)

**تقفيلة ليس:** نظام محاسبة، ERP، POS، ضرائب، ZATCA، مخزون، فواتير، OCR، أو موردين تفصيليين.

**تقفيلة هو:** تطبيق **تشغيل يومي** يعتمد على:

```text
الداخل − الخارج = الناتج
```

### ما يشمله التطبيق

- تسجيل **ملخص المبيعات اليومية** حسب قنوات البيع (`summary`).
- تسجيل **الخارج** كعمليات مستقلة: `purchases` | `expense` | `withdrawal`.
- مرفقات اختيارية.
- ملخص يومي وشهري تشغيلي.
- السجل (عرض العمليات).
- مراجعة، إلغاء (`void`)، استعادة (`restore`)، وسجل تدقيق (`audit trail`).
- تعدد المحلات ضمن منشأة واحدة.
- صلاحيات مالك وموظف (مدير `manager` معماريًا فقط — بدون شاشات الآن).
- مشاركة وتصدير بسيط لاحقًا.

### مصطلحات ومفاهيم ممنوعة كنطاق أساسي

لا تُستخدم في أسماء المجلدات، الخدمات، الوثائق، أو واجهات الـ API كمفهوم منتج:

| ممنوع | بديل مقبول |
|--------|------------|
| `accounting`, `ledger`, `journal`, قيود محاسبية | `entries`, `cash-movement`, `closeout` |
| `Debit` / `Credit` | لا يُستخدم (حساب تشغيلي فقط) |
| `P&L`, تقرير أرباح وخسائر محاسبي | تقارير تشغيلية: مبيعات، خارج، صافي الحركة |
| `VAT`, `ZATCA` | مؤجل — خارج النطاق |
| `tenantId` كمعرّف موازٍ | `organizationId` فقط |
| حذف قيود مالية | `void` / `restore` فقط |

**استثناء:** نصوص تسويقية في الـ Prototype قد تقول «ليس نظامًا محاسبيًا» — هذا توضيح للمستخدم وليس بناء محاسبة.

---

## 1. نموذج الـ SaaS

المستأجر = **منشأة** (`Organization`)، وليس المحل.

```text
Organization
  ├── Stores
  ├── Members
  ├── Subscription
  ├── Entitlements
  ├── Entries
  └── Attachments
```

### معرّفات البيانات (إلزامية في الإنتاج)

- `organizationId`
- `storeId`
- `userId`

**لا** تُضاف `tenantId` بجانب `organizationId` — حتى لا يختلط مفهوم SaaS multi-tenant مع اسم الكيان الفعلي `Organization`.

### `core/organization` — لا `core/tenant`

- مفهوم **SaaS multi-tenant** معتمد معماريًا.
- الكيان في المنتج والكود يسمى **`Organization`** وليس tenant.
- **اعتمد:** `core/organization` (أو ما يعادله لسياق المنشأة).
- **ممنوع:** `core/tenant` كمجلد أو مصطلح أساسي في الكود أو الوثائق.

### قواعد

- الاشتراك على مستوى `Organization`.
- المحل = `Store` داخل المنشأة.
- الموظف = `OrganizationMember` مرتبط بمحل أو أكثر.
- كل بيانات الأعمال تحمل `organizationId`.
- العزل الأمني في السيرفر وقاعدة البيانات — **ليس** بإخفاء أزرار في الواجهة فقط.

### ترحيل الـ Prototype — `businessId` (قرار معتمد)

**داخل الـ Baseline الحالي (`TaqfeelahPrototypeRuntime.jsx`):**

- أبقِ `businessId` و`configuredBusinesses` **كما هما**.
- **لا** Rename ولا Migration داخل الـ Prototype الآن.
- **لا** تعديل منطق العمليات بسبب تغيير الاسم.
- **السبب:** الـ Runtime مرجع بصري وسلوكي عامل؛ تعديل واسع للمعرّفات قد يكسر السلوك أو يسبب انحرافًا قبل تثبيت الواجهة.

**عند بدء التفكيك الإنتاجي لاحقًا:**

- الكود **الجديد فقط** يستخدم: `organizationId`, `storeId`, `userId`.
- `businessId` في الـ Prototype = اسم قديم مؤقت يعادل **`storeId`** داخل المرجع فقط.
- عند ترحيل كل feature من الـ Prototype: تحويل الربط إلى `storeId` + إضافة `organizationId` في طبقة Domain/Data الجديدة.
- **لا** يُمرَّر `businessId` إلى قاعدة البيانات الإنتاجية المستقبلية.

---

## 2. هيكلة الكود المستهدفة

```text
src/
  app/                         # Routes فقط — بدون منطق أعمال
  features/
    closeout/                  # تقفيلة المبيعات اليومية (summary)
    entries/                   # إضافة وعرض العمليات
    reports/                   # تقارير تشغيلية بسيطة
    stores/
    memberships/
    settings/
    sharing/
    auth/
    subscriptions/
  domain/
    organizations/
    stores/
    entries/
    cash-movement/             # الحسابات التشغيلية فقط
    reports/
    entitlements/
  core/
    auth/
    organization/              # سياق المنشأة — لا تُنشأ core/tenant
    config/
    errors/
  shared/
    ui/
    utils/
    i18n/
```

### ممنوع في الإنتاج

```text
features/accounting/
domain/accounting/
accountingService
ledger
```

### قواعد التنظيم

- `page.tsx` يستورد feature فقط.
- **UI لا يحسب** `totalSales`, `totalOutflow`, `netMovement`, `outflowRatio`.
- كل الحسابات التشغيلية في `domain/cash-movement` (أو `lib/calculations` مؤقتًا حتى إنشاء الـ domain).
- لا ملف ضخم يجمع كل الشاشات والمنطق.
- هدف الحجم: مكوّنات ~250–400 سطر كحد أقصى معقول؛ هوكات أصغر.
- **TypeScript إلزامي** لكود الإنتاج الجديد.
- `TaqfeelahPrototypeReference.tsx` و`TaqfeelahPrototypeRuntime.jsx`: **مرجع بصري / baseline** — ليست معمارية الإنتاج.

---

## 3. نموذج العمليات (`Entry`)

```ts
type EntryType =
  | "summary"      // ملخص مبيعات يومي حسب قنوات البيع فقط
  | "purchases"    // مشتريات
  | "expense"      // مصروف (مع بند مصروف)
  | "withdrawal";  // سحب
```

### قاعدة فصل التقفيلة عن الخارج

- `summary` **لا** يضم مشتريات أو مصروفات أو سحب.
- الخارج يُسجّل كعمليات مستقلة.
- التقرير اليومي يجمع:

```text
إجمالي المبيعات − إجمالي الخارج = صافي الحركة (netMovement)
```

---

## 4. قواعد الحساب (تشغيلي — ليس محاسبة قانونية)

كل الدوال في **طبقة domain واحدة** (`domain/cash-movement`).

| المقياس | التعريف |
|---------|---------|
| `totalSales` | مجموع `summary` النشطة |
| `totalOutflow` | مجموع `purchases` + `expense` + `withdrawal` النشطة |
| `netMovement` | `totalSales - totalOutflow` |
| `outflowRatio` | `totalOutflow / totalSales × 100` |
| غير قابل للحساب | مبيعات = 0 وخارج > 0 → عرض `—` أو `notCalculable` |

### المال في الإنتاج

```ts
type Money = {
  amountHalalas: number; // عدد صحيح — مثال: 125.75 ريال = 12575
  currency: "SAR";
};
```

العرض في UI يحوّل إلى ريال؛ التخزين والحساب بالهللات.

---

## 5. الإلغاء والسجل

| المصطلح | الاستخدام |
|---------|-----------|
| `Entry` | عملية مسجّلة |
| `void` | إلغاء — تُستبعد من الإجماليات وتبقى في السجل |
| `restore` | استعادة بعد إلغاء |
| `audit trail` | من / متى / سبب |

**ممنوع:** حذف فعلي للعمليات المؤثرة على الأرقام.

---

## 6. الأدوار

### Owner

تحكم كامل داخل المنشأة: محلات، موظفين، مراجعة مرفقات، void/restore، تقارير، اشتراك (لاحقًا).

### Employee (النسخة الأولى)

- إدخال فقط للمحلات المرتبطة به.
- ملخص يوم، مشتريات/مصروف/سحب، مرفق اختياري.
- **لا:** تقارير كاملة، إدارة محلات/موظفين، void/restore، اشتراك، إعدادات منشأة.

### Manager

موجود في النموذج المعماري فقط — **بدون** شاشات أو صلاحيات معقدة حتى قرار لاحق.

---

## 7. المصادقة

```text
User
AuthIdentity        // phone_otp | username_password (حسب قرار المرحلة)
OrganizationMember
```

- العمليات تُربط بـ `userId` — لا برقم جوال ولا اسم مستخدم في سجل العملية.
- **في الإنتاج:** Auth حقيقي (جلسات/توكنات)، أسرار في متغيرات بيئة فقط — **ممنوع** في Git.
- **في البروتايب (`/prototype-runtime`):** دخول تجريبي فقط (OTP/PIN ثابتة) — يبقى للعرض والمقارنة حتى استبدال المسار بـ `/app`.
- username/password في البروتايب: مرجع UX؛ التنفيذ الإنتاجي يُحدَّد في `docs/` عند بدء `features/auth`.

---

## 8. الاشتراكات والحدود

- على مستوى `Organization` فقط.
- Entitlements مركزية (مستقبلًا): `maxStores`, `maxEmployees`, `canUseAttachments`, `canExportPdf`, `canExportExcel`, `canUseMultiStore`.
- **لا** شروط باقات داخل مكوّنات UI.
- **لا** دفع حقيقي الآن.

---

## 9. الـ Prototype — `APPROVED UI BASELINE` (مجمّد)

**Tag:** `APPROVED UI BASELINE` — commit: `checkpoint/approved-ui-baseline-before-backend` (راجع `docs/APPROVED_UI_BASELINE.md`).

**حالة الاعتماد (مالك المنتج، 2026-06):** واجهة التطبيق التشغيلي **معتمدة بصريًا** على الجوال والتابلت. **لا تعديل** على التصميم أو التوزيع أو CSS المرئي أو Prototype Runtime **إلا بأمر صريح** من مالك المنتج.

**المسار الحالي للمرجع:** `/prototype-runtime` — بدون Landing Page في هذا الـ checkpoint. ملف **`TaqfeelahPrototypeRuntime.jsx` فقط** (`.jsx`، بدون نسخة `.tsx` موازية).

### ما يُمنع على ملف البروتايب

- إعادة تصميم الشاشات أو نقل عناصر (هيدر، تنقل، دفتر في غير الرئيسية/التقارير) **بدون موافقة صريحة**.
- إضافة منطق إنتاجي (API، DB، Auth حقيقي، فوترة) داخل الملف.
- تفكيك أو Rename لـ `businessId` داخل البروتايب.
- زيادة حجم الملف بميزات جديدة — الميزات الجديدة في `src/features/*` فقط.

### ما يُسمح على البروتايب

- إصلاح أخطاء عرض/تمرير **محددة** بطلب صريح من المالك فقط.
- تغيير الشعار/الأيقونات **فقط** إذا طلب المالك صراحةً — ليس ضمن التعديلات العادية أثناء بناء الخلفية.

### التفكيك الإنتاجي (المرحلة الحالية)

- كود **جديد** فقط: TypeScript في `src/features`, `src/domain`, `src/core`, `src/shared`.
- **مطابقة بصرية** لكل شاشة مع البروتايب قبل اعتبارها «منجزة».
- **لا** تحويل الملف الضخم إلى TypeScript دفعة واحدة.
- **لا** حذف `TaqfeelahPrototypeRuntime.jsx` حتى: (1) اكتمال `/app`, (2) مطابقة سلوكية، (3) موافقة صريحة.

`TaqfeelahPrototypeReference.tsx` إن وُجد: مرجع قديم اختياري — **ليس** مصدر الحقيقة.

---

## 10. المنصة والمسارات العامة

- الإصدار الأول: **Responsive Web** (جوال + كمبيوتر) + **PWA لاحقًا**.
- **لا** تطبيق Native الآن.
- التطبيق التشغيلي (`/app`) يحافظ على هوية الجوال/التابلت (لا إعادة تصميم سطح مكتب منفصلة له).
- **استثناء معتمد (مرحلة أخيرة):** لوحة إدارة SaaS (`/saas-admin`) تكون **Desktop-first** وموجهة لإدارة الاشتراكات وتقارير المستثمرين.
- **لا** Split View، **لا** Offline Sync في النسخة الأولى.

### الموقع العام vs التطبيق (قرار معتمد للإنتاج)

| المسار | الغرض |
|--------|--------|
| `/` | **Marketing:** تعريف بالمنتج، الباقات، تسجيل/اشتراك (لاحقًا)، زر **«الدخول إلى التطبيق»** |
| `/app` (أو `/login` → `/app`) | **التطبيق التشغيلي** — نفس شكل البروتايب المعتمد |
| `/saas-admin` | **SaaS Admin (Final Phase):** لوحة إدارة المنصة والتقارير الاستثمارية (Desktop-first) |
| `/prototype-runtime` | **مرجع مجمّد** — يبقى للمقارنة حتى إنهاء الترحيل |

- الزائر من الجوال أو الكمبيوتر يرى الهوم التعريفي أولًا؛ المستخدم المسجّل يُوجَّه إلى `/app` دون إعادة عرض التسويق في كل زيارة.
- صفحة التسويق **منفصلة** عن مكوّنات التقفيلة — لا تُدمج في `features/closeout`.

---

## 11. قرارات تقنية — معتمدة (Backend Foundation)

| قرار | الاختيار |
|------|----------|
| Database | **PostgreSQL** |
| ORM | **Drizzle ORM** + **drizzle-kit** migrations |
| API shape | REST `/api/v1` (عقود في `docs/API_CONTRACT.md`) |
| Hostinger VPS | مؤجل حتى اكتمال محلي + فحص السيرفر |

**قواعد:**

- **لا** Prisma بالتوازي.
- **لا** تغيير DB/ORM دون موافقة مالك المنتج.
- Auth / Billing / Object Storage / Export — موثّقة، **غير منفّذة** في مرحلة Foundation.

التفاصيل: `docs/ARCHITECTURE.md`.

**ما يبقى مؤجلًا بعد النسخة الأولى التشغيلية:**

مزود دفع · Feature Flags · Sentry · PDF/Excel سيرفري · PWA/Offline · جدول `daily_store_summaries` (تحسين لاحق — `docs/PERFORMANCE_RULES.md`)

---

## 12. فحوصات قبل الدمج (عند وجود كود إنتاج)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

اختبارات إلزامية مستقبلًا لـ `domain/cash-movement`: تجميع، void، restore، تواريخ، نسبة الخارج عند مبيعات صفر.

---

## 13. قرارات معتمدة (مرجع سريع)

| السؤال | القرار |
|--------|--------|
| المستأجر | `Organization` → عدة `Store` |
| العملة | `SAR` فقط؛ تخزين بالهللات |
| التقفيلة | `summary` فقط — الخارج منفصل |
| الموظف | إدخال لمحلاته فقط — بلا تقارير كاملة |
| المنصة | Web متجاوب + PWA لاحقًا |

---

## 14. قرارات التعارضات السابقة (معتمدة — مغلقة)

| الموضوع | القرار |
|---------|--------|
| `businessId` في الـ Prototype | يبقى في المرجع؛ `storeId` + `organizationId` في الإنتاج فقط — §1 و§9 |
| `core/tenant` | **لا يُستخدم** — `core/organization` فقط — §1 |
| `.jsx` vs `.tsx` للـ Runtime | البروتايب **`.jsx` مجمّد**؛ الإنتاج **TypeScript** — §9 |
| Landing vs Prototype مباشر | إنتاج: `/` تسويق + `/app` تشغيل؛ البروتايب يبقى على `/prototype-runtime` — §10 |

---

## 15. مرحلة البناء الإنتاجي — قواعد التنفيذ

### ترتيب العمل (إلزامي)

1. وثائق Foundation + checkpoint UI (منجز)
2. Drizzle schema + migrations (`docs/DATABASE_SCHEMA.md`)
3. `domain/cash-movement` + اختبارات وحدة
4. API ملخص يوم/شهر + سجل paginated — **تجميع SQL مباشر** على `entries` (بدون `daily_store_summaries` في المرحلة 1)
5. Auth + سياق منشأة (بدون اعتمادات فعلية في repo)
6. شاشات `/app` واحدة تلو الأخرى مطابقة للبروتايب
7. Marketing `/` (لاحقًا — ليس في UI checkpoint الحالي)
8. Final phase: SaaS admin desktop-first (`/saas-admin`) + analytics + investor reporting

### قواعد كل PR / مهمة

- **لا** منطق حساب في مكوّنات React.
- **لا** `businessId` في طبقة DB أو API الإنتاجية.
- **لا** أسرار أو OTP ثابت في كود الإنتاج.
- كل endpoint يفرض `organizationId` من الجلسة — لا من body فقط.
- الموظف: التحقق من `storeId` على السيرفر.

### تعريف «منتهٍ»

شاشة إنتاجية = نفس الشكل المعتمد في البروتايب + بيانات حقيقية + صلاحيات صحيحة + `pnpm lint` · `typecheck` · `test` · `build` ناجحة.

---

## 16. كيان DailyCloseout (مستقبلي — البروتايب حاليًا Demo UI فقط)

واجهة الموظف والمالك تعتمد على كيان **`DailyCloseout`**: تقفيلة يوم واحد لمحل واحد، مرتبطة بالداخل (قنوات المحل)، الخارج، المرفقات، وسجل التدقيق.

التنفيذ الحالي في `src/features/daily-closeouts/` و`src/features/employee-closeouts/` يشمل **Demo UI State** (`localStorage` + Context) بالإضافة إلى مسار API عند تفعيل الأعلام.

### سياسة صفر مراجعة (مقصود — لا يُغيّر بدون قرار منتج)

مسار مراجعة التقفيلات من المالك **محذوف** — وليس معطّلاً بإعداد. مراجعة مرفقات العمليات تبقى حقلًا منفصلًا على `entries` ولا تُخلط بمراجعة التقفيلة.

| المصطلح | المعنى الحالي | ملاحظة |
|---------|---------------|--------|
| `draft` | مسودة محلية غير مرسلة | يبقى |
| `submitted` | قيمة DB افتراضية قديمة + مدخلات demo | **لا تغيير schema** بدون migration؛ تُعرَض كـ sent |
| `reviewed` | تسمية UI للتقفيلة المرسلة/المعتمدة | ليست «بانتظار مراجعة» |
| `returned` | حالة demo/localStorage قديمة | تُطبَّع إلى `reviewed` عند القراءة |
| `waitingReview` | نصوص قديمة | حُذفت من `prototype-runtime-copy` |
| `openCloseoutAlertInRegister` | فتح تنبيه التقفيلة في السجل | سابقًا `reviewCloseoutAlertRecord` |
| `pendingOwnerCloseoutQueue` | طابور مالك فارغ (stub) | سابقًا `pendingSubmittedCloseouts` |

| الحدث | السلوك |
|-------|--------|
| إرسال الموظف | اعتماد فوري: DB `approved`، واجهة `reviewed`، السجل التشغيلي `active` |
| تعديل بعد الإرسال | **المالك/المدير فقط** عبر `resubmit` (اسم لاحق مقترح: `ownerEdit`) |
| مرفقات بانتظار المراجعة (تقفيلة) | **لا يوجد** — لا حقل pending في API أو التقارير |

إعدادات المحل المحذوفة (`reviewEnabled`، `closeoutReviewEnabled`، `attachmentAlert`) تُشطَب عند التطبيع ولا تُعاد.

انظر أيضًا: `.cursor/rules/closeout-review-defaults.mdc`

---

## 17. مراجع الاعتماد والوثائق

| البند | القيمة |
|--------|--------|
| UI tag | `APPROVED UI BASELINE` |
| Checkpoint commit | `checkpoint/approved-ui-baseline-before-backend` |
| مرجع UX | `TaqfeelahPrototypeRuntime.jsx` |
| وثائق الباكند | `ARCHITECTURE`, `DATABASE_SCHEMA`, `API_CONTRACT`, `PERFORMANCE_RULES` |
| نسخة تحميل الجوال | `src/prototype-build-stamp.mjs` |

---

*أي مساهمة تخالف هذا الملف تُرفض في المراجعة حتى تُحدَّث الوثيقة أو يُصدر قرار صريح من مالك المنتج.*

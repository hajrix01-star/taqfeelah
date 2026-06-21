# سجل refactor التاريخي — تقفيلة V2

> **الحالة:** سجل تاريخي لدفعات التفكيك السابقة؛ ليس خريطة الحالة الحالية.
> للحالة والأولويات الحالية راجع `docs/PRODUCTION_STATUS.md` و`docs/ARCHITECTURE.md`.

---

## مراحل الانجاز والمتبقي

> **رموز:** ✅ منتهي · 🟠 لم ينتهي · المراحل **المجزّأة** لها صفوف فرعية تحت عنوانها.

| # | المرحلة / الجزء | الحالة | ملاحظة |
|---|-----------------|--------|--------|
| 0 | **سياسة الدمج والنشر** (PR=test، main=نشر) | ✅ | معتمدة 2026-06-08 — `.cursor/rules/merge-deploy-batch-policy.mdc` |
| 1 | **PR-1 — بوابة الاستقرار** | ✅ | مدمج في PR #85 (`f29f62b`) |
| 1.1 | ↳ smoke حدود وحدات + `check:refactor` + ESLint `no-undef` | ✅ | Runtime + إصلاح RatioBadge + hooks في OperationModal |
| 1.2 | ↳ `pnpm check:refactor` كاملًا (يشمل `smoke:browser`) | ✅ | lint + typecheck + test + smoke:browser — محليًا 2026-06-08 |
| 1.3 | ↳ تشك لست يدوي (دخول مالك/موظف، خروج) | ✅ | smoke آلي + تأكيد إنتاج 2026-06-08 |
| 2 | **PR-2 — عقد الداتا والتقفيلات** *(مجزّأة)* | ✅ | مدمج في PR #85 — كود مكتمل |
| 2.أ | ↳ أ — مصدر الحقيقة (flags + localStorage skip) | ✅ | توثيق `.env.example` + تحقق Provider |
| 2.أ.1 | ↳↳ اختبار تكامل صريح لسلوك localStorage skip | 🟠 لم ينتهي | اختياري |
| 2.ب | ↳ ب — عقد التقفيلات (`closeoutId`، `daySequence`، drafts) | ✅ | `resolveSubmitCloseoutId` + `findCloseoutsForStoreDate` |
| 2.ج | ↳ ج — اختبارات وحدة/تكامل | ✅ | 4 ملفات اختبار — CI أخضر |
| 2.ج.1 | ↳↳ `pnpm smoke:closeouts` (يتطلب DB) | 🟠 لم ينتهي | تحقق يدوي قبل إغلاق المرحلة |
| 2.4 | ↳ تشك لست تشغيل (flags=ON، تقفيلتان/يوم، resubmit) | 🟠 لم ينتهي | تحقق يدوي على VPS |
| 3 | **PR-3 — تفكيك UI فقط** *(مجزّأة)* | ✅ | مدمج في PR #85 — نقل حرفي |
| 3.1 | ↳ TopBar + BottomNav → `prototype-runtime-chrome.jsx` | ✅ | ~3360 سطر في Runtime بعد النقل |
| 3.2 | ↳ مكوّنات عرضية إضافية | ✅ | PR #90 مدمج؛ PR #91 يحذف legacy ميت + يستخرج إعدادات الموظف |
| 3.3 | ↳ `pnpm check:refactor` كاملًا | ✅ | نفس بوابة 1.2 — محليًا 2026-06-08 |
| 3.4 | ↳ تشك لست يدوي (TopBar + BottomNav) | ✅ | smoke يحمّل owner/employee shell مع Chrome |
| 4 | **PR #86 — imports + smoke + policy** | ✅ | مدمج `54efa88` — نشر VPS |
| 4.1 | ↳ إصلاح imports في `OwnerSettingsSection` + `no-undef` | ✅ | + smoke OwnerSettings/OwnerReports |
| 4.2 | ↳ تنظيف imports ميتة في Runtime (الدفعة 1) | ✅ | ~100+ import محذوف |
| 5 | **PR #87 — تنظيف imports (batch 2)** | ✅ | مدمج `2fe613c` — نشر VPS ✅ |
| 6 | **Hotfix #88 — حماية `channel config`** | ✅ | مدمج `254e16f` — إصلاح تعطل بوابة الموظف على الإنتاج |
| 7 | **مرحلة لاحقة — PR-4+** *(مجزّأة)* | 🟠 لم ينتهي | object storage + auth قبل الإطلاق |
| 7.0 | ↳ **PR #89 — استخراج مرفقات البروتايب** | ✅ | مدمج `193be00` — نشر VPS |
| 7.0.1 | ↳ **PR #90 — مكوّنات العرض (batch 1+2)** | ✅ | مدمج `01d9cde` — نشر VPS ✅ تأكيد إنتاج |
| 7.0.2 | ↳ **PR #91 — تنظيف legacy موظف** | ✅ | مدمج `8e4fc59` — نشر VPS |
| 7.1 | ↳ مرفقات (سقف حجم/عدد، object storage) | 🟠 لم ينتهي | IndexedDB + ضغط صور ✅ في #89؛ object storage لاحقًا |
| 7.2 | ↳ استخراج hooks من Runtime (موجات G–J + #138–#143) | ✅ | مدمج `69fa103` — Runtime ~418 سطر |
| 7.2.1 | ↳ **Wave K — Calculation Unification** | ✅ | `summarizeEntries` → `rowsFromUiEntries` + `calculateDaySummary`؛ parity tests خضراء |
| 7.3 | ↳ Auth كامل + إيقاف `ALLOW_HEADER_AUTH_CONTEXT` | ✅ | مفعّل في `deploy-production.yml` (wave 7) |

**ملخص سريع:** ✅ **25** بند · 🟠 **4** بنود لم تنتهِ (+ اختياري واحد) · النشط: **تأكيد VPS** · **7.1** · **7.3 auth**.

---

## سياسة الدمج والنشر المعتمدة ✅

> **معتمدة من مالك المنتج — 2026-06-08.** قاعدة المشروع: `.cursor/rules/merge-deploy-batch-policy.mdc`

```text
PR / فرع  →  تطوير + اختبار CI  →  لا يلمس اللايف
main      →  دمج دفعة واحدة     →  نشر VPS تلقائي
```

| قاعدة | التفاصيل |
|-------|----------|
| **لا دمج على `main`** | إلا بطلب صريح: «الدفعة جاهزة للايف» / «ادمج» / «انشر» |
| **تجميع التعديلات** | PR واحد (أو قليل) لكل دفعة منطقية — تجنب نشرات متكررة |
| **الاختبار** | CI أخضر على PR قبل أي دمج |
| **الاستثناء** | hotfix إنتاج فقط — بموافقة صريحة |

---

## الهدف

تفكيك `TaqfeelahPrototypeRuntime.jsx` وربط مصدر الحقيقة بقاعدة البيانات **بدون تغيير الشكل الخارجي أو تدفق الواجهة المعتمد** (`docs/APPROVED_UI_BASELINE.md`).

---

## مبادئ ثابتة (لا تُخالَف)

| المبدأ | التفاصيل |
|--------|----------|
| **UI baseline** | لا تعديل بصري أو تدفق بدون طلب صريح من مالك المنتج |
| **مصدر الحقيقة** | DB/API لكل البيانات الدائمة بما فيها تفضيلات الواجهة؛ browser storage للـ prototype/demo فقط |
| **Auth** | Prototype Access Mode مؤقتًا؛ auth كامل لاحقًا قبل الإطلاق |
| **التحقق** | لا merge بدون فحوصات فعلية (انظر بوابات كل PR) |
| **أقل PRs** | 3 PRs رئيسية + مرحلة لاحقة — دمج خطوات مترابطة داخل كل PR |

---

## الحالة الحالية

```text
المرحلة النشطة: PR-4+ — تأكيد VPS · object storage (اختياري) · auth (آخر خطوة)
التقدم الإجمالي:  ████████████████████  Runtime ~418 سطر؛ Wave K ✅؛ ops hardening #133
المرحلة التالية:  تشيك يدوي VPS · 7.1 object storage · 7.3 auth
```

| PR | الحالة | ملاحظة |
|----|--------|--------|
| PR #85 (الدفعة 1–3) | 🟢 مدمج على `main` | `f29f62b` |
| PR #86 (imports + policy) | 🟢 مدمج على `main` | `54efa88` |
| PR #87 (imports batch 2) | 🟢 مدمج على `main` | `2fe613c` |
| PR #88 (hotfix channels) | 🟢 مدمج على `main` | `254e16f` |
| PR #89 (attachments extract) | 🟢 مدمج على `main` | `193be00` — نشر VPS |
| PR #90 (entry screens + dialogs) | 🟢 مدمج على `main` | `01d9cde` — نشر VPS ✅ |
| PR #91 (employee legacy cleanup) | 🟢 مدمج على `main` | `8e4fc59` — نشر VPS |
| Runtime waves G–J | 🟢 مدمج على `main` | `3511cca` — UI + orchestration hooks |
| PR #133 (ops hardening) | 🟢 مدمج على `main` | `12cc29a` — logging، rate limit، ErrorBoundary |
| PR #138–#143 (runtime splits) | 🟢 مدمج على `main` | `69fa103` — Runtime ~418 سطر |
| Wave K (حسابات) | 🟢 مُغلق | `summarizeEntries` موحّد مع `calculateDaySummary` + parity tests |
| لاحقًا PR-4+ | 🟡 جاري | تأكيد VPS · object storage · auth |

---

## بوابة التحقق الموحّدة

```bash
# قبل أي refactor أو قبل merge أي PR من هذه الخارطة
corepack pnpm check:refactor
```

يتضمن: `lint` → `typecheck` → `test` → `smoke:browser`

**pre-commit الحالي:** `lint` + `typecheck` + `test` فقط (بدون browser smoke — عمدًا لأنه بطيء).  
**CI:** يشغّل browser smoke كاملًا (`.github/workflows/ci.yml`).

---

## PR-1 — بوابة الاستقرار

**الهدف:** منع تكرار `ReferenceError` وأخطاء النقل أثناء التفكيك.  
**مخاطرة:** منخفضة | **UI:** لا تغيير (إصلاحات سلوك داخلية فقط حيث لزم).

### نطاق العمل

- [x] استبدال `src/smoke.test.ts` باختبار حدود وحدات runtime
- [x] إضافة script `check:refactor` في `package.json`
- [x] تعزيز ESLint: `no-undef` على `TaqfeelahPrototypeRuntime.jsx` فقط
- [x] إصلاح `RatioBadge` import (كان مفقودًا بعد استخراج `OwnerReportsSection`)
- [x] إصلاح ترتيب hooks في `OperationModal` (قواعد React)
- [x] `lint` + `typecheck` + `test` ✅
- [x] `pnpm check:refactor` كاملًا (يشمل `smoke:browser`) — CI ✅ على PR #86
- [x] merge PR-1 (كود مدمج في الفرع الحالي)

### تشك لست — بعد الدمج

- [x] `/` → شاشة «وضع الدخول التجريبي» — `prototype-access.smoke.spec.ts`
- [x] دخول كمالك → الرئيسية بدون أخطاء console — smoke
- [x] دخول كموظف → «تقفيلاتي اليومية» — smoke
- [x] تسجيل خروج وعودة — smoke

### تراجع

Revert PR واحد — لا أثر على بيانات أو API.

---

## PR-2 — عقد الداتا والتقفيلات

**الهدف:** حسم مصدر الحقيقة وتثبيت `closeoutId` + `daySequence`.  
**مخاطرة:** متوسطة | **UI:** لا تغيير.

### نطاق العمل (مدمج في PR واحد)

**أ. مصدر الحقيقة**

- [x] توثيق flags في `.env.example` (`ENTRIES_API` + تعليق header auth)
- [x] التحقق: عند `ENTRIES_API_DB_SOURCE` لا كتابة entries في localStorage (موجود مسبقًا)
- [x] التحقق: عند `CLOSEOUTS_API_DB_SOURCE` لا اعتماد `readDailyCloseouts()` كمصدر (موجود في Provider)
- [ ] اختبار تكامل صريح لسلوك localStorage skip (اختياري)

**ب. عقد التقفيلات**

- [x] `resolveSubmitCloseoutId` — UUID من السيرفر بدل `closeout-{storeId}-{date}`
- [x] `closeoutId` + `daySequence` من السيرفر (موجود في list entries/closeouts)
- [x] `trustServerDaySequenceOnly` عند `ENTRIES_API_DB_SOURCE` في السجل
- [x] `findCloseoutsForStoreDate` + تحسين `findCloseoutForStoreDate`
- [x] إصلاح دمج drafts في `DailyCloseoutsProvider` (لا حظر تقفيلة ثانية/يوم)

**ج. اختبارات**

- [x] `closeouts-route.test.ts` — توليد server id
- [x] `resolve-submit-closeout-id.test.ts`
- [x] `register-operation-display.test.ts` — وضع DB
- [x] `daily-closeouts-demo-store.test.ts` — multi-closeout/يوم
- [ ] `pnpm smoke:closeouts` (يتطلب DB — تحقق يدوي قبل merge نهائي)

### تشك لست — تشغيل (DB flags=ON)

- [ ] موظف: submit تقفيلة → `closeoutId` فريد
- [ ] نفس اليوم: تقفيلة ثانية → `daySequence = 2`، عرض «B» في السجل
- [ ] مالك: سجل يعرض تقفيلتين منفصلتين لنفس اليوم
- [ ] resubmit → نفس `closeoutId` ونفس `daySequence`
- [ ] جهاز/نافذة ثانية: نفس البيانات بعد reload
- [ ] demo flags=OFF ما زال يعمل (عدم كسر المسار المحلي)

### مخاطرة مؤجّلة (موثّقة)

- تزامن `daySequence` عند إرسالين متزامنين — لا جدول `daily_closeouts` الآن

### تراجع

Revert PR-2؛ إن وُجدت بيانات ملوّثة بـ fallback قديم → script repair لمرة واحدة.

---

## PR-3 — تفكيك UI فقط

**الهدف:** تقليل حجم `TaqfeelahPrototypeRuntime.jsx` بنقل عرضي حرفي.  
**مخاطرة:** منخفضة | **UI:** نفس الشكل حرفيًا.

### نطاق العمل

- [x] نقل `TopBar` → `prototype-runtime-chrome.jsx`
- [x] نقل `BottomNav` في نفس PR
- [x] إصلاح `OwnerSettingsSection.jsx` imports + `no-undef` ESLint
- [x] مكوّنات عرضية إضافية (PR #90 مدمج؛ PR #91 تنظيف legacy)
- [x] **لا نقل** state / hooks / API loading

### تشك لست

- [x] `lint` + `typecheck` + `test` ✅
- [x] `pnpm check:refactor` كاملًا (يشمل smoke:browser) — CI ✅
- [x] نقل حرفي — نفس classNames وترتيب DOM
- [x] TopBar + BottomNav — smoke يحمّل owner/employee shell

### ملاحظة معروفة (من PR-1)

`OwnerSettingsSection.jsx` — imports نُقلت من Runtime؛ **مُصلَح في PR-4** مع `no-undef` على الملف.

---

## مرحلة لاحقة — PR-4+

**يبدأ بعد:** أسبوع تشغيل مستقر لـ PR-2 وPR-3.

| موضوع | محتوى | أولوية |
|--------|--------|--------|
| مرفقات | سقف حجم/عدد؛ تحضير object storage | متوسطة — عند الحاجة (أو تخزين محلي VPS) |
| منطق | ~~استخراج hooks من Runtime~~ ✅ G–J + #138–#143 | — |
| ~~Wave K — Calculation Unification~~ | ✅ `summarizeEntries` → `calculateDaySummary`؛ `accounting-parity` + `closeout-day-summary-parity` | — |
| Auth كامل | جلسات حقيقية؛ إيقاف `ALLOW_HEADER_AUTH_CONTEXT` | **آخر خطوة** قبل الإطلاق |

### سياسة مصدر الحقيقة المالي (معتمدة)

- **production DB mode** (`ENTRIES_API_ENABLED=true`): الإجماليات النهائية للرئيسية/التقارير من **PostgreSQL → API summary → `calculateDaySummary`** — **لا** `summarizeEntries` كمصدر نهائي.
- **`summarizeEntries`**: demo/local + قوائم/تفاصيل تشغيلية؛ يُحسب محليًا لكن **`resolveOwnerPeriodSummaryPreference`** يفرض API في DB mode (`entriesDbSource: true` → `preferEntrySummaries = false`).
- **golden/parity tests** (`accounting-parity.test.ts`, `operational-analytics.test.ts`, `closeout-day-summary-parity.test.ts`) ✅ خضراء — Wave K مُغلق.
- **تنظيف اختياري لاحقًا:** `TaqfeelahPrototypeReference.tsx` (مرجع قديم غير مستخدم)؛ تكرار `ratio` في `closeout-share-operations.js`.

---

## أعلى مخاطر مفتوحة

| # | الخطر | الحالة |
|---|-------|--------|
| 1 | `closeoutId` fallback = `store + date` | 🟢 مُغلق — PR-2 |
| 2 | `findCloseoutForStoreDate` يفترض تقفيلة/يوم | 🟢 مُغلق — PR-2 (`findCloseoutsForStoreDate`) |
| 3 | dual-source (DB + localStorage + demo) | 🟡 جزئي — يحتاج flags=ON في VPS |
| 4 | fallback `daySequence` في العميل | 🟢 مُغلق في وضع DB — PR-2 |
| 5 | inline attachments في DB | 🟢 مؤجل مقبول |
| 6 | تزامن `daySequence` | 🟢 مؤجل |

---

## مراجع

| وثيقة | الغرض |
|--------|--------|
| `docs/APPROVED_UI_BASELINE.md` | حماية الشكل الخارجي |
| `docs/PROTOTYPE_ACCESS_MODE.md` | مراحل DB-first وflags |
| `docs/FEATURE_FLAGS_MATRIX.md` | مصفوفة الأعلام |
| `docs/API_CONTRACT.md` | عقود closeouts/entries |

---

## سجل التحديثات

| التاريخ | ما تغيّر |
|---------|----------|
| 2026-06-08 | إنشاء الملف. خطة 3 PRs. بدء PR-1: smoke.test.ts، check:refactor، eslint no-undef، إصلاح RatioBadge + OperationModal hooks |
| 2026-06-08 | PR-1 مكتمل (كود). بدء PR-2: resolveSubmitCloseoutId، trustServerDaySequenceOnly، findCloseoutsForStoreDate، إصلاح دمج drafts، اختبارات |
| 2026-06-08 | PR-3 مكتمل (كود): نقل TopBar وBottomNav إلى prototype-runtime-chrome.jsx؛ Runtime ~3360 سطر |
| 2026-06-08 | دمج PR #85 على main (`f29f62b`). اعتماد سياسة: PR=اختبار، main=نشر دفعة واحدة |
| 2026-06-08 | PR #86: سياسة merge-deploy، إصلاح OwnerSettingsSection imports، smoke + تنظيف imports في Runtime |
| 2026-06-08 | دمج PR #86 (`54efa88`) + hotfix PR #88 (`254e16f`) — حماية channel config على الإنتاج |
| 2026-06-08 | إضافة جدول **مراحل الانجاز والمتبقي** في أعلى الملف |
| 2026-06-08 | PR #87: تنظيف imports إضافي (~60 سطر)، rebase على main، `check:refactor` ✅ محليًا |
| 2026-06-08 | دمج PR #87 على main (`2fe613c`) — نشر VPS ✅ |
| 2026-06-08 | بدء PR-4+: PR #89 — استخراج `prototype-attachment-storage` + `prototype-runtime-attachment-ui` من Runtime |
| 2026-06-08 | دمج PR #89 على main (`193be00`) — نشر VPS |
| 2026-06-08 | PR #90 batch 2 محليًا: `prototype-runtime-operation-dialogs.jsx` — OperationModal، QuickAddSheet، void/restore/duplicate، SavedOutflowShare |
| 2026-06-08 | دمج PR #90 على main (`01d9cde`) — نشر VPS ✅ — تأكيد إنتاج سليم |
| 2026-06-08 | بدء PR #91: حذف شاشات موظف legacy ميتة، استخراج `EmployeeSettingsScreen`، إصلاح `formatCalendarDate` import |
| 2026-06-08 | دمج PR #91 على main (`8e4fc59`) — نشر VPS — Runtime ~2624 سطر |
| 2026-06-09 | موجات Runtime G–J مدمجة (`3511cca`): UI (home/register/share/closeout modals) + hooks (session/entries/closeouts/auth) — Runtime ~921 سطر |
| 2026-06-09 | تسجيل **Wave K — Calculation Unification** (لاحقًا): adapter `summarizeEntries` → `calculateDaySummary` بدون تغيير نتائج |
| 2026-06-10 | دمج PR #133 ops hardening (`12cc29a`) — pino، rate limit، ErrorBoundary، pool tuning |
| 2026-06-10 | دمج PR #138–#143 — تفكيك Runtime/closeouts/settings؛ Runtime ~418 سطر |
| 2026-06-10 | **إغلاق Wave K (7.2.1) ✅** — تحقق: `summarizeEntries` غلاف رفيع؛ DB mode يفضّل API؛ parity tests خضراء |
| 2026-06-14 | **دفعة احترافية — باقات ومصدر الحقيقة** — PR #230: حدود الباقة، org-config SSOT، reconcile script |
| 2026-06-14 | **دفعة UX باقات** — PR #231: رسالة رفض إضافة محل؛ تمييز «أساسية + فترة تجريبية» |
| 2026-06-14 | **دفعة P6–P8** — PR #232: PIN من `auth_identities`، إيقاف `provisionStaffMembers`، فرض حدود الباقة داخل المعاملات |

---

## دفعة الاحتراف الكامل — قائمة الإصلاحات

| # | البند | الحالة | ملاحظة |
|---|--------|--------|--------|
| P1 | توحيد حدود الباقة (مميزات = عداد = منع) | ✅ | منشور 2026-06-14 |
| P2 | محلات/فريق من السيرفر (SSOT) | ✅ | منشور 2026-06-14 |
| P3 | رسالة واضحة عند رفض إضافة محل (حد الخطة) | ✅ | PR #231 |
| P4 | تمييز «أساسية + فترة تجريبية» عن «تجربة مجانية» | ✅ | PR #231 |
| P5 | تنظيف بيانات فوق الحد (`db:reconcile-entitlements`) | 🟠 | سكربت جاهز — تشغيل على VPS |
| P6 | PIN من `auth_identities` فقط | ✅ | PR #232 |
| P7 | إيقاف `provisionStaffMembers` في الإنتاج | ✅ | PR #232 |
| P8 | قيود DB على حدود الباقة | ✅ | PR #232 |

---

## دفعة IA — إعدادات المالك (معتمدة 2026-06-19)

> **المرجع الكامل:** `docs/OWNER_SETTINGS_IA_PLAN.md` (مخططات + checklist حذف المكرر)

| # | البند | الحالة |
|---|--------|--------|
| IA-1 | 4 تبويبات مسطّحة بدل 4+3 | 🟠 |
| IA-2 | دمج «محلات وفريق» — مصدر واحد لربط موظف↔محل | 🟠 |
| IA-3 | اشتراك: تفاصيل في «المساعدة»؛ ترقية من نافذة الخطة | 🟠 |
| IA-4 | حذف staff panels من إعدادات المحل | 🟠 |
| IA-5 | تنظيف legacy `home` / rename «الشكل» | 🟠 |
| IA-6 | شارة الخطة + `OwnerPlanPickerModal` (جدول → اختيار → ترقية → واتساب) | 🟠 |

---

## كيفية تحديث هذا الملف

بعد إكمال كل PR أو خطوة مهمة:

1. حدّث **الحالة الحالية** وشريط التقدم.
2. حدّث جدول **مراحل الانجاز والمتبقي**: ✅ للمنتهي، 🟠 لم ينتهي للمتبقي.
3. أضف سطرًا في **سجل التحديثات** مع التاريخ وملخص التغيير.
4. انقل المخاطر المغلقة من «مفتوحة» إلى «مغلقة» مع ذكر PR.

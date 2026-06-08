# خارطة refactor التشغيلية — تقفيلة V2

> **ملف حي:** يُحدَّث بعد كل مرحلة مكتملة أو merge.  
> آخر تحديث: **2026-06-08** — اعتماد سياسة الدمج والنشر الدفعي (مالك المنتج).

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
| **مصدر الحقيقة** | DB/API للبيانات التشغيلية عند تفعيل flags؛ localStorage لتفضيلات UI فقط |
| **Auth** | Prototype Access Mode مؤقتًا؛ auth كامل لاحقًا قبل الإطلاق |
| **التحقق** | لا merge بدون فحوصات فعلية (انظر بوابات كل PR) |
| **أقل PRs** | 3 PRs رئيسية + مرحلة لاحقة — دمج خطوات مترابطة داخل كل PR |

---

## الحالة الحالية

```text
المرحلة النشطة: PR-4 — إصلاح imports + سياسة الدمج (فرع، لم يُدمج بعد)
التقدم الإجمالي:  ██████████  دفعة refactor مدمجة — `f29f62b`
المرحلة التالية:  CI على PR → دمج عند طلب «جاهز للايف»
```

| PR | الحالة | ملاحظة |
|----|--------|--------|
| PR #85 (الدفعة 1–3) | 🟢 مدمج على `main` | 2026-06-08 — نشر VPS تلقائي |
| PR #86 (imports + policy) | 🟡 PR مفتوح | CI — لا دمج حتى طلب صريح |
| لاحقًا مرفقات + منطق | ⬜ مؤجّل | بعد PR-4 مستقر |

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
- [ ] `pnpm check:refactor` كاملًا (يشمل `smoke:browser`) — عند merge
- [x] merge PR-1 (كود مدمج في الفرع الحالي)

### تشك لست — بعد الدمج

- [ ] `/` → شاشة «وضع الدخول التجريبي»
- [ ] دخول كمالك → الرئيسية بدون أخطاء console
- [ ] دخول كموظف → «تقفيلاتي اليومية»
- [ ] تسجيل خروج وعودة

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
- [ ] مكوّنات عرضية إضافية (مؤجّل)
- [x] **لا نقل** state / hooks / API loading

### تشك لست

- [x] `lint` + `typecheck` + `test` ✅
- [ ] `pnpm check:refactor` كاملًا (يشمل smoke:browser)
- [x] نقل حرفي — نفس classNames وترتيب DOM
- [ ] TopBar + BottomNav — تحقق يدوي سريع

### ملاحظة معروفة (من PR-1)

`OwnerSettingsSection.jsx` — imports نُقلت من Runtime؛ **مُصلَح في PR-4** مع `no-undef` على الملف.

---

## مرحلة لاحقة — PR-4+

**يبدأ بعد:** أسبوع تشغيل مستقر لـ PR-2 وPR-3.

| موضوع | محتوى | أولوية |
|--------|--------|--------|
| مرفقات | سقف حجم/عدد؛ تحضير object storage | متوسطة |
| منطق | استخراج hooks من Runtime | منخفضة |
| Auth كامل | جلسات حقيقية؛ إيقاف `ALLOW_HEADER_AUTH_CONTEXT` | قبل الإطلاق |

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

---

## كيفية تحديث هذا الملف

بعد إكمال كل PR أو خطوة مهمة:

1. حدّث **الحالة الحالية** وشريط التقدم.
2. علّم بنود التشك لست `[x]` المكتملة.
3. أضف سطرًا في **سجل التحديثات** مع التاريخ وملخص التغيير.
4. انقل المخاطر المغلقة من «مفتوحة» إلى «مغلقة» مع ذكر PR.

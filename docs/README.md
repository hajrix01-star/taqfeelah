# فهرس وثائق تقفيلة

> آخر تحديث: 2026-06-26

هذا الفهرس يميز بين الوثائق المعتمدة حاليًا وبين الوثائق التاريخية. عند التعارض، المرجع الأول هو الكود الحالي، ثم الوثائق المعتمدة في هذا الملف.

## الوثائق المعتمدة

| الوثيقة | الغرض |
|---|---|
| `ARCHITECTURE.md` | معمارية التطبيق الحالية وتدفق البيانات |
| `CONVENTIONS.md` | قواعد المنتج والكود الإلزامية |
| `API_CONTRACT.md` | عقود واجهات API الحالية والمخطط لها صراحة |
| `DATABASE_SCHEMA.md` | جداول PostgreSQL والعلاقات والفهارس |
| `DATA_SOURCE_UNIFICATION.md` | سياسة مصدر الحقيقة ومنع fallback الإنتاجي |
| `FEATURE_FLAGS_MATRIX.md` | متغيرات البيئة والأعلام المعتمدة |
| `PERFORMANCE_RULES.md` | قواعد الأداء والترقيم والاستعلامات الكبيرة |
| `PRODUCTION_STATUS.md` | حالة الإنتاج والقرارات المؤجلة |
| `transformation-plan-01.md` | سجل خطة التحول 01 وحالتها |
| `APPROVED_UI_BASELINE.md` | حدود تغيير الواجهة المعتمدة |

## التشغيل والنشر

| الوثيقة | الغرض |
|---|---|
| `STAGING_DEPLOY_RUNBOOK.md` | طريقة نشر staging |
| `VPS_LAUNCH_RUNBOOK.md` | إجراءات إطلاق VPS |
| `LIVE_DEPLOY_BATCH_PLAN.md` | سياسة دفعات النشر |
| `PRELAUNCH_MANUAL_SMOKE.md` | فحص يدوي قبل الاعتماد |
| `VPS_ENV_SETUP_FOR_OWNER.md` | إعداد أسرار وبيئة المالك |
| `DIRECT_PRODUCTION_DEPLOY_LOG.md` | سجل النشر المباشر |

## وثائق ميزات

- `PHASE_10_AUTH.md` — المصادقة والجلسات.
- `PHASE_11_SAAS_ADMIN.md` — لوحة إدارة SaaS.
- `OWNER_PUBLIC_SIGNUP.md` — تسجيل المالك العام.
- `PLATFORM_ADMIN_EMAIL_AUTH.md` — دخول مسؤول المنصة بالبريد.
- `INCOME_SOURCES.md` — قنوات الدخل.
- `OWNER_SETTINGS_IA_PLAN.md` — تنظيم إعدادات المالك.

## الأرشيف

الملفات داخل `docs/archive/` تاريخية فقط. لا تستخدمها كمرجع للتنفيذ الحالي إلا لفهم سبب قرار قديم.

أمثلة:

- `archive/removed-access-mode.md`
- `archive/REFACTOR_ROADMAP.md`
- `archive/DEPLOYMENT_WAVES.md`
- `archive/PRELAUNCH_CLEANUP.md`
- `archive/PRELAUNCH_AUDIT_AND_REMEDIATION.md`
- `archive/SAAS_ADMIN_DASHBOARD_PLAN.md`
- `archive/PRODUCTION_SOURCE_OF_TRUTH_CUTOVER_PLAN.md`

## قاعدة تحديث الوثائق

أي تغيير يمس API أو قاعدة البيانات أو المصادقة أو مصدر البيانات أو النشر يجب أن يحدث الوثيقة المعتمدة المرتبطة به في نفس التغيير. لا تكتب "منفذ" إلا إذا كان معه كود واختبار أو تحقق تشغيل واضح.

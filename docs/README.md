# فهرس وثائق تقفيلة

> آخر تحديث: **2026-06-22**

هذا الفهرس يحدد الوثائق الحالية التي يعتمد عليها التطوير، ويفصلها عن الخطط والسجلات التاريخية.

## المراجع الحالية المعتمدة

| الوثيقة | الغرض |
|---|---|
| `../README.md` | نقطة البداية، التشغيل المحلي، خريطة المستودع |
| `ARCHITECTURE.md` | المعمارية الفعلية وتدفق البيانات والطبقات |
| `CONVENTIONS.md` | قواعد المنتج والكود الإلزامية |
| `PRODUCTION_STATUS.md` | المنجز، أولويات ما قبل الإطلاق، والقرارات المؤجلة |
| `DATA_SOURCE_UNIFICATION.md` | مصدر الحقيقة وسياسة التخزين في الإنتاج |
| `DATABASE_SCHEMA.md` | جداول PostgreSQL والعلاقات والفهارس |
| `API_CONTRACT.md` | عقود API الحالية والأقسام المخططة المعلّمة صراحة |
| `PERFORMANCE_RULES.md` | قواعد الاستعلام والترقيم واختبار الضغط |
| `FEATURE_FLAGS_MATRIX.md` | أعلام البيئة وسلوكها |
| `APPROVED_UI_BASELINE.md` | حدود تغيير الواجهة المعتمدة |

## أدلة التشغيل والإطلاق

| الوثيقة | الغرض |
|---|---|
| `PRELAUNCH_MANUAL_SMOKE.md` | اختبار يدوي قبل اعتماد الإطلاق |
| `PRELAUNCH_CLEANUP.md` | ما أزيل من مسارات التطوير والتجربة |
| `VPS_LAUNCH_RUNBOOK.md` | إجراءات إطلاق VPS |
| `VPS_ENV_SETUP_FOR_OWNER.md` | إعداد البيئة والأسرار للمالك |
| `LIVE_DEPLOY_BATCH_PLAN.md` | سياسة دفعات النشر |
| `DEPLOYMENT_WAVES.md` | سجل موجات تفعيل الميزات |

## وثائق ميزات متخصصة

- `PHASE_10_AUTH.md` — المصادقة والجلسات.
- `PHASE_11_SAAS_ADMIN.md` — لوحة إدارة SaaS.
- `OWNER_PUBLIC_SIGNUP.md` — تسجيل المالك العام.
- `PLATFORM_ADMIN_EMAIL_AUTH.md` — دخول مسؤول المنصة بالبريد.
- `INCOME_SOURCES.md` — قنوات الدخل.
- `OWNER_SETTINGS_IA_PLAN.md` — تنظيم إعدادات المالك.

## سجلات تاريخية وخطط

هذه الملفات مفيدة لفهم سبب القرارات، لكنها ليست وصفًا وحيدًا للحالة الحالية:

- `REFACTOR_ROADMAP.md`
- `PRELAUNCH_AUDIT_AND_REMEDIATION.md`
- `BATCH_4_JS_TS_MIGRATION.md`
- `PROTOTYPE_ACCESS_MODE.md`
- `SAAS_ADMIN_DASHBOARD_PLAN.md`

عند التعارض، ارجع إلى الكود ثم `PRODUCTION_STATUS.md` و`ARCHITECTURE.md`.

## قاعدة تحديث الوثائق

أي تغيير يعدل schema أو API أو المصادقة أو مصدر البيانات أو النشر يجب أن يحدّث الوثيقة المعتمدة المرتبطة به في نفس commit. لا تُكتب حالة «منفذ» إلا إذا كان لها كود واختبار أو تحقق تشغيل واضح.

# فهرس وثائق تقفيلة

> آخر تحديث: 2026-06-26

هذا هو فهرس الوثائق النشطة. أي ملف داخل `docs/archive/` تاريخي فقط ولا يستخدم كمرجع تنفيذ يومي.

## الوثائق المعتمدة

| الوثيقة | الغرض |
| --- | --- |
| `ARCHITECTURE.md` | معمارية التطبيق وتدفق البيانات |
| `CONVENTIONS.md` | قواعد المنتج والكود |
| `API_CONTRACT.md` | عقود API الحالية |
| `DATABASE_SCHEMA.md` | جداول PostgreSQL والعلاقات |
| `DATA_SOURCE_UNIFICATION.md` | سياسة مصدر الحقيقة ومنع مصادر البيانات المحلية في الإنتاج |
| `FEATURE_FLAGS_MATRIX.md` | أعلام البيئة المعتمدة |
| `PERFORMANCE_RULES.md` | قواعد الأداء والاستعلامات الكبيرة |
| `PRODUCTION_STATUS.md` | حالة الإنتاج والقرارات المؤجلة |
| `APPROVED_UI_BASELINE.md` | حدود تعديل الواجهة المعتمدة |
| `INCOME_SOURCES.md` | نموذج طرق الدفع ومصادر الدخل |
| `OWNER_SETTINGS_IA_PLAN.md` | تنظيم إعدادات المالك الحالي |
| `SEO_MARKETING_LAUNCH_PLAN.md` | خطة SEO والتسويق قبل الإطلاق مع مستهدفات وقائمة تحقق |
| `MAINTENANCE_SCRIPTS.md` | تصنيف سكربتات الصيانة والهجرة والتشخيص |
| `transformation-plan-01.md` | سجل خطة التحول 01 |

## التشغيل والنشر

| الوثيقة | الغرض |
| --- | --- |
| `STAGING_DEPLOY_RUNBOOK.md` | مسار نشر staging |
| `VPS_LAUNCH_RUNBOOK.md` | إطلاق VPS |
| `LIVE_DEPLOY_BATCH_PLAN.md` | سياسة دفعات النشر |
| `PRELAUNCH_MANUAL_SMOKE.md` | فحص يدوي قبل الاعتماد |
| `VPS_ENV_SETUP_FOR_OWNER.md` | إعداد بيئة وأسرار المالك |
| `DIRECT_PRODUCTION_DEPLOY_LOG.md` | سجل النشر المباشر |

## قاعدة التحديث

أي تغيير يمس API أو قاعدة البيانات أو المصادقة أو مصدر البيانات أو النشر يجب أن يحدث الوثيقة المرتبطة في نفس التغيير.

لا تكتب "منفذ" إلا إذا كان معه كود وتحقق واضح.

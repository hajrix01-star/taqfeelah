# Live Deploy Batch Plan

> آخر تحديث: 2026-06-26

الغرض من هذه الوثيقة هو منع النشر المتكرر غير المنضبط. أي انتقال إلى اللايف يحتاج دفعة واضحة، فحوصات ناجحة، وقرار صريح.

## القاعدة

```text
feature branch -> main -> fast production deploy

Staging is manual-only and used only when the owner/project lead explicitly requests a comprehensive deep check.
```

| القاعدة | المعنى |
|---|---|
| `main` يمثل الإنتاج | لا يدمج إليه إلا ما نريد نشره |
| staging للتجربة | فرع التجربة ينشر على staging |
| لا نشر جزئي خطر | اجمع التغييرات المرتبطة في دفعة مفهومة |
| لا wipe بدون قرار | مسح البيانات إجراء مستقل وخطر |

## قبل الدمج إلى `main`

- `lint` ناجح.
- `typecheck` ناجح.
- `test` ناجح.
- `build` ناجح.
- staging منشور ومجرب.
- `/api/v1/meta` يطابق commit المطلوب.
- smoke يدوي مكتمل على المسارات المهمة.

## قبل الإنتاج

1. توثيق commit المطلوب.
2. أخذ backup إذا كان التغيير يمس DB أو مرفقات.
3. تشغيل بوابة النشر.
4. التأكد من secrets المطلوبة.
5. موافقة صريحة من المالك.

## بعد الإنتاج

- تحقق `/api/v1/meta`.
- تحقق `/app`.
- تحقق تسجيل الدخول.
- تحقق عملية أو تقفيلة صغيرة إن كان مناسبًا.
- راقب الأخطاء والـ logs.

## متى نوقف النشر

أوقف النشر إذا:

- فشل build أو test.
- فشل login أو session.
- ظهر اختلاف بيئة بين staging والإنتاج.
- فشلت بوابة auth أو DB.
- لم يوجد rollback واضح لتغيير خطر.

## مراجع

- `docs/STAGING_DEPLOY_RUNBOOK.md`
- `docs/VPS_LAUNCH_RUNBOOK.md`
- `docs/PRELAUNCH_MANUAL_SMOKE.md`
- `docs/PRODUCTION_STATUS.md`

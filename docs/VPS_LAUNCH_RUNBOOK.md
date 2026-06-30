# VPS Launch Runbook

> آخر تحديث: 2026-06-26

هذا الدليل مختصر ومخصص لتشغيل الإنتاج على VPS. النشر الروتيني مباشر إلى الإنتاج، ويستخدم staging فقط إذا طلب المالك فحصًا عميقًا.

## 1. فحص البيئة

تأكد من وجود القيم الأساسية:

| المتغير | المطلوب |
|---|---|
| `DATABASE_URL` | موجود |
| `AUTH_SESSION_SECRET` | قوي |
| `APP_MODE` | `production` |
| `NEXT_PUBLIC_APP_MODE` | `production` |
| `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE` | `true` |
| `ALLOW_HEADER_AUTH_CONTEXT` | `false` |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | UUIDs لمسؤولي المنصة |

ثم شغل فحص البيئة إن كان متاحًا:

```bash
pnpm prelaunch:check:strict --env-file .env.production
```

## 2. قبل النشر

- عند طلب فحص عميق فقط: staging ناجح.
- commit المطلوب معروف.
- backup جاهز إذا كان التغيير يمس DB أو مرفقات.
- لا توجد migrations غير مفهومة.
- قرار المالك واضح.

## 3. النشر

الإنتاج ينشر من `main`. لا تنشر تغييرات فرع تجربة مباشرة إلى الإنتاج إلا إذا كان ذلك قرارًا استثنائيًا موثقًا.

بعد النشر:

```bash
curl https://taqfeelah.com/api/v1/meta
```

تحقق أن `build` يطابق commit المطلوب.

## 4. فحص ما بعد النشر

1. افتح `/app`.
2. سجل دخول مالك.
3. اختبر قراءة المحلات والموظفين.
4. اختبر السجل والرئيسية.
5. اختبر SaaS Admin إن كان التغيير يمسه.
6. راقب logs.

## 5. متى نرجع

ابدأ rollback أو إيقاف النشر إذا:

- `/app` لا يفتح.
- auth يفشل للمستخدمين الصحيحين.
- API يرجع 500 بشكل متكرر.
- `/api/v1/meta` لا يطابق النسخة المطلوبة.
- ظهرت مشكلة بيانات إنتاجية.

## مراجع

- `docs/LIVE_DEPLOY_BATCH_PLAN.md`
- `docs/STAGING_DEPLOY_RUNBOOK.md`
- `docs/PRELAUNCH_MANUAL_SMOKE.md`

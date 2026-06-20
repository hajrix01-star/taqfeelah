# دليل الإطلاق على VPS — خطوة بخطوة

> **متى:** بعد CI أخضر على PR #342 وقبل merge إلى `main`  
> **من ينفّذ:** مالك المنتج  
> **المدة:** ~45–60 دقيقة (env + wipe + smoke)

---

## 1. ضبط `.env.production` على VPS

تأكد من وجود القيم التالية (راجع `.env.example`):

| المتغير | مطلوب |
|---------|--------|
| `DATABASE_URL` | ✅ |
| `AUTH_SESSION_SECRET` | ≥16 حرف |
| `UPSTASH_REDIS_REST_URL` | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ |
| `AUTH_RATE_LIMIT_REDIS_REQUIRED` | `true` |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | UUIDs مفصولة بفاصلة |
| `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE` | `true` |
| `APP_MODE` | `production` |

```bash
pnpm prelaunch:check:strict --env-file .env.production
```

---

## 2. merge و deploy (عند «جاهز للايف»)

1. تأكد CI أخضر على PR
2. قل **«جاهز للايف»** → merge PR إلى `main`
3. انتظر `deploy-production.yml` ينجح

---

## 3. مسح البيانات التجريبية

```bash
# نسخ احتياطي (موصى به)
pg_dump "$DATABASE_URL" > backup-before-live-$(date +%Y%m%d).sql

# معاينة
pnpm prelaunch:wipe

# تنفيذ
PRELAUNCH_WIPE_CONFIRM=wipe-all-tenant-data-for-live pnpm prelaunch:wipe:apply

pnpm db:migrate
```

---

## 4. بوابة الإطلاق الآلية

```bash
pnpm prelaunch:live-gate --env-file .env.production
CHECK_BASE_URL=https://your-domain pnpm prelaunch:live-gate --env-file .env.production
```

---

## 5. اختبار يدوي + أول عميل

1. نفّذ `docs/PRELAUNCH_MANUAL_SMOKE.md` — كل البنود ☑
2. أنشئ أول حساب من `/saas-admin/accounts/new`
3. **لا** `seed-auth-credentials` بعد wipe

---

## 6. قرار الإعلان

| الحالة | الإجراء |
|--------|---------|
| كل ☑ | أعلن الإطلاق للعملاء |
| أي ✗ حرج | fix → PR → redeploy → أعد الاختبار |

---

## مراجع

- `docs/LIVE_DEPLOY_BATCH_PLAN.md`
- `docs/PRELAUNCH_MANUAL_SMOKE.md`
- `scripts/prelaunch-live-gate.mjs`

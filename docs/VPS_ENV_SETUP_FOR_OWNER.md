# ضبط الإنتاج — للمالك (بدون خبرة برمجة)

> **الخلاصة:** لا تحتاج فتح ملفات على السيرفر يدويًا.  
> الأسرار تُحفظ في **GitHub** → كل **نشر** يكتبها تلقائيًا في `/opt/taqfeelah/.env.production` على VPS.

> **قرار المالك (2026-06-20):** **Upstash اختياري** — يمكن الإطلاق بدونه.  
> حماية تسجيل الدخول تعمل بذاكرة السيرفر (كافية للبداية).

---

## ماذا يحدث تلقائيًا (لا تلمسه)

| المتغير | المصدر |
|---------|--------|
| `DATABASE_URL` | GitHub Secret |
| `AUTH_SESSION_SECRET` | GitHub Secret |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | GitHub Secret |
| `APP_MODE=production` | النشر |
| باقي flags التطبيق | النشر |

**إذا الموقع يعمل اليوم** — هذه الغالبية **موجودة مسبقًا**.

---

## Upstash — **تخطّه للإطلاق** ✅

| | |
|---|---|
| **ما هو؟** | خدمة اختيارية لتقوية حماية تسجيل الدخول عند التوسع |
| **هل ضروري؟** | **لا** — قرار المشروع محدّث |
| **بدونه** | Rate limit في ذاكرة السيرفر (يُصفّر عند restart — مقبول للبداية) |
| **متى تضيفه؟** | عند نمو العملاء أو أكثر من سيرفر — لاحقًا |

**لا تحتاج أي خطوة Upstash قبل «جاهز للايف».**

---

## (اختياري لاحقًا) إضافة Upstash

1. [console.upstash.com](https://console.upstash.com/) → Create Redis database
2. GitHub Secrets: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
3. على VPS أو في Secrets: `AUTH_RATE_LIMIT_REDIS_REQUIRED=true`
4. redeploy

---

## تحقق قبل الإطلاق

بعد merge PR و deploy:

```bash
cd /opt/taqfeelah
pnpm prelaunch:check:strict --env-file .env.production
```

يجب أن يمرّ ✅ **بدون** Upstash (يطبع ملاحظة أن Upstash اختياري).

---

## قائمة GitHub Secrets للإطلاق

| Secret | مطلوب؟ |
|--------|--------|
| `VPS_*`, `DATABASE_URL`, `AUTH_SESSION_SECRET` | ✅ |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | ✅ |
| `UPSTASH_*` | ⏸ اختياري (لاحقًا) |
| `RESEND_API_KEY` / SMTP | ⚠️ إن forgot-password مفعّل |

---

## بعد ذلك

`docs/VPS_LAUNCH_RUNBOOK.md` — مسح البيانات → smoke → أول عميل.

## مراجع

- `docs/LIVE_DEPLOY_BATCH_PLAN.md`
- `docs/VPS_LAUNCH_RUNBOOK.md`

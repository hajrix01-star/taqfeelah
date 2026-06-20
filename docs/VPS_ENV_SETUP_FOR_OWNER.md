# ضبط الإنتاج — للمالك (بدون خبرة برمجة)

> **الخلاصة:** لا تحتاج فتح ملفات على السيرفر يدويًا في الغالب.  
> الأسرار تُحفظ في **GitHub** → كل **نشر** يكتبها تلقائيًا في `/opt/taqfeelah/.env.production` على VPS.

---

## ماذا يحدث تلقائيًا (لا تلمسه)

عند merge إلى `main`، النشر يضبط على VPS مثل:

| المتغير | المصدر |
|---------|--------|
| `DATABASE_URL` | GitHub Secret |
| `AUTH_SESSION_SECRET` | GitHub Secret |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | GitHub Secret |
| `APP_MODE=production` | النشر |
| `AUTH_RATE_LIMIT_REDIS_REQUIRED=true` | النشر (ثابت) |
| باقي flags التطبيق | النشر |

**إذا الموقع يعمل اليوم** — هذه الغالبية **موجودة مسبقًا**.

---

## ما الذي تحتاج أنت فقط (قبل «جاهز للايف»)

### الخطوة 1 — حساب Upstash (5 دقائق، مرة واحدة)

Upstash = خدمة Redis مجانية/رخيصة لحماية تسجيل الدخول (منع brute-force).

1. افتح [console.upstash.com](https://console.upstash.com/) وسجّل دخول (Google/GitHub).
2. **Create database** → نوع **Redis**.
3. المنطقة: الأقرب للسعودية/الVPS (مثل `eu-central-1` إن لم يتوفر `me-*`).
4. بعد الإنشاء، من تبويب **REST API** انسخ:
   - **UPSTASH_REDIS_REST_URL** (يبدأ بـ `https://...upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (نص طويل)

احتفظ بهما في مكان آمن (Notes) — لن نعرضهما في المحادثة مرة أخرى.

---

### الخطوة 2 — إضافة سرّين في GitHub (3 دقائق)

1. افتح:  
   [github.com/hajrix01-star/taqfeelah/settings/secrets/actions](https://github.com/hajrix01-star/taqfeelah/settings/secrets/actions)
2. **New repository secret** — الاسم **`UPSTASH_REDIS_REST_URL`** → الصق الرابط.
3. **New repository secret** — الاسم **`UPSTASH_REDIS_REST_TOKEN`** → الصق التوكن.

> لا تضف `AUTH_RATE_LIMIT_REDIS_REQUIRED` يدويًا — النشر يضعه `true` تلقائيًا.

---

### الخطوة 3 — تحقق (بعد النشر التالي)

بعد merge PR الإطلاق إلى `main` ونجاح deploy:

1. (اختياري) SSH للVPS — **فقط إن كنت مرتاحًا**:
   ```bash
   cd /opt/taqfeelah
   pnpm prelaunch:check:strict --env-file .env.production
   ```
2. أو اطلب من المطور/الوكيل تشغيل نفس الأمر والتأكد من ✅.

---

## هل أحتاج SSH وتعديل `.env.production`؟

| الحالة | الجواب |
|--------|--------|
| أضفت Upstash في GitHub Secrets + نشر جديد | **لا** — النشر يحدّث الملف |
| تريد اختبار قبل merge | يمكن لمن لديه SSH إضافة السطرين على VPS مؤقتًا |
| لا Upstash ولا GitHub secrets | **لا تقل «جاهز للايف»** — strict gate سيفشل |

---

## قائمة GitHub Secrets المهمة للإطلاق

| Secret | مطلوب للايف؟ | ملاحظة |
|--------|-------------|--------|
| `VPS_HOST`, `VPS_USER`, `VPS_PASS` أو `VPS_SSH_PRIVATE_KEY` | ✅ | للنشر |
| `DATABASE_URL` | ✅ | PostgreSQL |
| `AUTH_SESSION_SECRET` | ✅ | ≥16 حرف |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | ✅ | UUID مالك المنصة |
| `UPSTASH_REDIS_REST_URL` | ✅ **جديد** | من Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ **جديد** | من Upstash |
| `RESEND_API_KEY` أو SMTP | ⚠️ | إن forgot-password مفعّل |
| `AUTH_EMAIL_FROM` | ⚠️ | مع البريد |

---

## بعد Upstash + النشر

تابع `docs/VPS_LAUNCH_RUNBOOK.md`:

1. مسح البيانات التجريبية (`prelaunch:wipe:apply`)
2. `prelaunch:live-gate`
3. checklist `PRELAUNCH_MANUAL_SMOKE.md`
4. أول عميل من `/saas-admin/accounts/new`
5. قل **«جاهز للايف»** للإعلان

---

## مراجع

- `docs/VPS_LAUNCH_RUNBOOK.md`
- `docs/LIVE_DEPLOY_BATCH_PLAN.md`
- `.env.example`
